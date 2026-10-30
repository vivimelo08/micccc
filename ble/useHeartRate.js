import { useCallback, useEffect, useRef, useState } from 'react';
import { PermissionsAndroid, Platform } from 'react-native';
import { manager } from './manager';
import {
  HR_SERVICE_UUID,
  HR_MEASUREMENT_UUID,
  interpretarFrequenciaCardiaca,
  bpmValido,
} from './heartRateParser';
import { salvarBatimento } from '../database/database';

const TEMPO_BUSCA_MS = 15000;
const INTERVALO_GRAVACAO_MS = 5000;
const MAX_TENTATIVAS = 5;

async function solicitarPermissoes() {
  if (Platform.OS !== 'android') return true;

  if (Number(Platform.Version) >= 31) {
    const r = await PermissionsAndroid.requestMultiple([
      PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
      PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
    ]);
    return (
      r[PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN] ===
        PermissionsAndroid.RESULTS.GRANTED &&
      r[PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT] ===
        PermissionsAndroid.RESULTS.GRANTED
    );
  }

  const r = await PermissionsAndroid.request(
    PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
  );
  return r === PermissionsAndroid.RESULTS.GRANTED;
}

// status: 'idle' | 'scanning' | 'connecting' | 'connected' | 'reconnecting' | 'error'
export function useHeartRate() {
  const [status, setStatus] = useState('idle');
  const [bpm, setBpm] = useState(null);
  const [contato, setContato] = useState(null);
  const [nomeDispositivo, setNomeDispositivo] = useState('');
  const [mensagem, setMensagem] = useState('Desconectado');

  const montadoRef = useRef(true);
  const deviceIdRef = useRef(null);
  const monitorRef = useRef(null);
  const desconexaoRef = useRef(null);
  const manualRef = useRef(false);
  const ocupadoRef = useRef(false);
  const ultimaGravacaoRef = useRef(0);

  const seguro = useCallback((fn) => {
    if (montadoRef.current) fn();
  }, []);

  const limpar = useCallback(() => {
    monitorRef.current?.remove();
    monitorRef.current = null;
    desconexaoRef.current?.remove();
    desconexaoRef.current = null;
  }, []);

  // Conecta a um dispositivo já conhecido e assina as notificações.
  const iniciarMonitoramento = useCallback(
    async (device) => {
      const conectado = await device.connect({ timeout: 12000 });
      await conectado.discoverAllServicesAndCharacteristics();

      deviceIdRef.current = conectado.id;
      seguro(() => setNomeDispositivo(conectado.name || conectado.localName || 'Sensor BLE'));

      limpar();

      desconexaoRef.current = conectado.onDisconnected(() => {
        limpar();
        if (manualRef.current || !montadoRef.current) return;
        tentarReconectar();
      });

      monitorRef.current = conectado.monitorCharacteristicForService(
        HR_SERVICE_UUID,
        HR_MEASUREMENT_UUID,
        (erro, caracteristica) => {
          if (erro) {
            // Erro durante desconexão é tratado em onDisconnected.
            return;
          }
          if (!caracteristica?.value) return;

          try {
            const leitura = interpretarFrequenciaCardiaca(caracteristica.value);

            seguro(() => setContato(leitura.contato));

            if (!bpmValido(leitura.bpm) || leitura.contato === false) {
              seguro(() => setBpm(null));
              return;
            }

            seguro(() => {
              setBpm(leitura.bpm);
              setMensagem('Recebendo batimentos.');
            });

            const agora = Date.now();
            if (agora - ultimaGravacaoRef.current >= INTERVALO_GRAVACAO_MS) {
              ultimaGravacaoRef.current = agora;
              salvarBatimento({
                bpm: leitura.bpm,
                contato: leitura.contato,
                recebido_em: new Date().toISOString(),
              }).catch((e) => console.error('Erro ao salvar batimento:', e));
            }
          } catch (e) {
            console.error('Pacote HR inválido:', e);
          }
        }
      );

      seguro(() => {
        setStatus('connected');
        setMensagem('Conectado. Aguardando batimentos...');
      });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const tentarReconectar = useCallback(async () => {
    const id = deviceIdRef.current;
    if (!id) return;

    for (let tentativa = 1; tentativa <= MAX_TENTATIVAS; tentativa++) {
      if (manualRef.current || !montadoRef.current) return;

      seguro(() => {
        setStatus('reconnecting');
        setBpm(null);
        setMensagem(`Conexão perdida. Reconectando (${tentativa}/${MAX_TENTATIVAS})...`);
      });

      try {
        const device = await manager.connectToDevice(id, { timeout: 10000 });
        await iniciarMonitoramento(device);
        return;
      } catch {
        await new Promise((r) => setTimeout(r, 1500 * tentativa));
      }
    }

    seguro(() => {
      setStatus('error');
      setMensagem('Não foi possível reconectar. Toque em Conectar para tentar de novo.');
    });
  }, [iniciarMonitoramento, seguro]);

  const conectar = useCallback(async () => {
    if (ocupadoRef.current) return;
    ocupadoRef.current = true;
    manualRef.current = false;

    try {
      if (!(await solicitarPermissoes())) {
        throw new Error('Permissão Bluetooth negada. Autorize nas configurações do celular.');
      }

      if ((await manager.state()) !== 'PoweredOn') {
        throw new Error('Ative o Bluetooth do celular e tente novamente.');
      }

      setStatus('scanning');
      setBpm(null);
      setMensagem('Procurando sensor de batimentos...');

      // Filtra pelo serviço padrão 0x180D: qualquer cinta/sensor compatível aparece.
      const device = await new Promise((resolve, reject) => {
        const timer = setTimeout(() => {
          manager.stopDeviceScan();
          reject(
            new Error(
              'Nenhum sensor encontrado. Confira se está ligado, com contato na pele e não conectado a outro app.'
            )
          );
        }, TEMPO_BUSCA_MS);

        manager.startDeviceScan([HR_SERVICE_UUID], { allowDuplicates: false }, (erro, d) => {
          if (erro) {
            clearTimeout(timer);
            manager.stopDeviceScan();
            reject(erro);
            return;
          }
          if (d) {
            clearTimeout(timer);
            manager.stopDeviceScan();
            resolve(d);
          }
        });
      });

      seguro(() => {
        setStatus('connecting');
        setMensagem('Sensor encontrado. Conectando...');
      });

      await iniciarMonitoramento(device);
    } catch (erro) {
      manager.stopDeviceScan();
      seguro(() => {
        setStatus('error');
        setMensagem(erro?.message || 'Falha na conexão.');
      });
    } finally {
      ocupadoRef.current = false;
    }
  }, [iniciarMonitoramento, seguro]);

  const desconectar = useCallback(async () => {
    manualRef.current = true;
    manager.stopDeviceScan();
    limpar();

    const id = deviceIdRef.current;
    deviceIdRef.current = null;

    if (id) {
      try {
        await manager.cancelDeviceConnection(id);
      } catch {}
    }

    seguro(() => {
      setStatus('idle');
      setBpm(null);
      setContato(null);
      setMensagem('Desconectado');
    });
  }, [limpar, seguro]);

  useEffect(() => {
    montadoRef.current = true;
    return () => {
      montadoRef.current = false;
      manualRef.current = true;
      manager.stopDeviceScan();
      limpar();
      if (deviceIdRef.current) {
        manager.cancelDeviceConnection(deviceIdRef.current).catch(() => {});
      }
    };
  }, [limpar]);

  return { status, bpm, contato, nomeDispositivo, mensagem, conectar, desconectar };
}
