
import React, { useEffect, useState } from 'react';
import {
  Alert,
  PermissionsAndroid,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { manager } from '../../ble/manager';
import { Buffer } from 'buffer';
import {
  salvarMedicaoApollo,
  buscarUltimaMedicaoApollo,
} from '../../database/database';

// UUIDs derivados dos arrays de 16 bytes do código Arduino.
// Se a descoberta de serviços falhar, confira os UUIDs reportados
// pelo dispositivo no scanner BLE.
const SERVICE_UUID =
  '12345678-1234-1234-1234-123456789abc';

const DATA_UUID =
  '12345678-1234-1234-1234-123456789abd';

const ALERT_UUID =
  '12345678-1234-1234-1234-123456789abe';

// Singleton: evita criar um gerenciador novo em cada renderização.

const C = {
  fundo: '#C9C3E6',
  azul: '#5574B8',
  texto: '#30364D',
  branco: '#FFFFFF',
  verde: '#55B878',
  vermelho: '#D9534F',
  cinza: '#65708F',
};

function interpretarPacoteApollo(base64) {
  const bytes = Buffer.from(base64, 'base64');

  if (bytes.length !== 14) {
    throw new Error(
      `Pacote inválido: esperados 14 bytes, recebidos ${bytes.length}.`
    );
  }

  // O Arduino envia int16_t em little-endian.
  const lerInt16 = posicao => bytes.readInt16LE(posicao * 2);

  return {
    aceleracao_x: lerInt16(0) / 1000,
    aceleracao_y: lerInt16(1) / 1000,
    aceleracao_z: lerInt16(2) / 1000,
    giroscopio_x: lerInt16(3) / 10,
    giroscopio_y: lerInt16(4) / 10,
    giroscopio_z: lerInt16(5) / 10,
    intensidade_sonora: lerInt16(6) / 10000,
    recebido_em: new Date().toISOString(),
  };
}

async function solicitarPermissoes() {
  if (Platform.OS !== 'android') return true;

  if (Number(Platform.Version) >= 31) {
    const resultado = await PermissionsAndroid.requestMultiple([
      PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
      PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
    ]);

    return (
      resultado[PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN] ===
        PermissionsAndroid.RESULTS.GRANTED &&
      resultado[PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT] ===
        PermissionsAndroid.RESULTS.GRANTED
    );
  }

  const resultado = await PermissionsAndroid.request(
    PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
  );

  return resultado === PermissionsAndroid.RESULTS.GRANTED;
}

export default function Bluetooth() {
  const [dispositivos, setDispositivos] = useState([]);
  const [dispositivo, setDispositivo] = useState(null);
  const [procurando, setProcurando] = useState(false);
  const [conectando, setConectando] = useState(false);
  const [mensagem, setMensagem] = useState('Desconectado');
  const [medicao, setMedicao] = useState(null);
  const [alertaSOS, setAlertaSOS] = useState(false);

  useEffect(() => {
    let ativo = true;
    let assinaturaDados = null;
    let assinaturaAlerta = null;
    let assinaturaEstado = null;
    let dispositivoAtual = null;

    buscarUltimaMedicaoApollo()
      .then(dados => {
        if (ativo && dados) setMedicao(dados);
      })
      .catch(erro => console.error('Erro ao carregar medição:', erro));

    assinaturaEstado = manager.onStateChange(estado => {
      if (!ativo) return;

      if (estado !== 'PoweredOn') {
        setMensagem('Ative o Bluetooth do celular.');
      }
    }, true);

    async function conectar(item) {
      try {
        manager.stopDeviceScan();
        setProcurando(false);
        setConectando(true);
        setMensagem('Conectando ao Apollo...');

        const conectado = await item.device.connect();
        dispositivoAtual = conectado;

        await conectado.discoverAllServicesAndCharacteristics();

        // Confirma se o serviço esperado realmente existe.
        const servicos = await conectado.services();
        const servicoExiste = servicos.some(
          s => s.uuid.toLowerCase() === SERVICE_UUID
        );

        if (!servicoExiste) {
          throw new Error(
            'Serviço Apollo não encontrado. Confira o UUID do dispositivo.'
          );
        }

        if (!ativo) {
          await conectado.cancelConnection();
          return;
        }

        setDispositivo({
          id: conectado.id,
          name: item.name,
        });

        setMensagem('Conectado. Recebendo medições...');

        assinaturaDados =
          conectado.monitorCharacteristicForService(
            SERVICE_UUID,
            DATA_UUID,
            async (erro, caracteristica) => {
              if (erro) {
                console.error('Erro nos dados Apollo:', erro);
                if (ativo) setMensagem('Erro ao receber medições.');
                return;
              }

              if (!caracteristica?.value) return;

              try {
                const dados = interpretarPacoteApollo(
                  caracteristica.value
                );

                // Aguarda a gravação antes de atualizar a tela.
                await salvarMedicaoApollo(dados);

                if (ativo) {
                  setMedicao(dados);
                  setMensagem('Medição recebida e salva.');
                }
              } catch (erroPacote) {
                console.error('Pacote Apollo inválido:', erroPacote);
                if (ativo) {
                  setMensagem('Não foi possível interpretar o pacote.');
                }
              }
            }
          );

        assinaturaAlerta =
          conectado.monitorCharacteristicForService(
            SERVICE_UUID,
            ALERT_UUID,
            (erro, caracteristica) => {
              if (erro) {
                console.error('Erro no alerta Apollo:', erro);
                return;
              }

              if (!caracteristica?.value) return;

              const texto = Buffer.from(
                caracteristica.value,
                'base64'
              ).toString('utf8').trim();

              if (texto === 'SOS') {
                setAlertaSOS(true);
                Alert.alert(
                  'Alerta Apollo',
                  'O dispositivo enviou um alerta SOS por intensidade sonora.'
                );
              } else if (texto === 'NORMAL') {
                setAlertaSOS(false);
              }
            }
          );
      } catch (erro) {
        console.error('Falha na conexão Apollo:', erro);

        if (ativo) {
          setMensagem(erro.message || 'Falha na conexão.');
          Alert.alert(
            'Erro de conexão',
            erro.message || 'Não foi possível conectar ao Apollo.'
          );
        }

        try {
          await dispositivoAtual?.cancelConnection();
        } catch {}

        dispositivoAtual = null;
      } finally {
        if (ativo) setConectando(false);
      }
    }

    // Guarda uma função para o botão conectar poder usá-la.
    conectarRef.current = conectar;

    return () => {
      ativo = false;
      manager.stopDeviceScan();
      assinaturaEstado?.remove();
      assinaturaDados?.remove();
      assinaturaAlerta?.remove();

      // Ao sair desta tela, encerramos a conexão para evitar
      // callbacks duplicados ao entrar nela novamente.
      dispositivoAtual?.cancelConnection().catch(() => {});
    };
  }, []);

  const conectarRef = React.useRef(null);

  const procurar = async () => {
    try {
      const permitido = await solicitarPermissoes();

      if (!permitido) {
        Alert.alert(
          'Permissão necessária',
          'Permita o acesso ao Bluetooth para continuar.'
        );
        return;
      }

      const estado = await manager.state();

      if (estado !== 'PoweredOn') {
        Alert.alert('Bluetooth desligado', 'Ative o Bluetooth do celular.');
        return;
      }

      setDispositivos([]);
      setProcurando(true);
      setMensagem('Procurando Apollo...');

      manager.stopDeviceScan();

      manager.startDeviceScan(
        [SERVICE_UUID],
        { allowDuplicates: false },
        (erro, encontrado) => {
          if (erro) {
            manager.stopDeviceScan();
            setProcurando(false);
            setMensagem('Erro durante a busca.');
            console.error(erro);
            return;
          }

          if (!encontrado) return;

          const nome = encontrado.name || encontrado.localName || '';

          // O Arduino anuncia o nome "Apollo".
          if (
            nome.toLowerCase().includes('apollo') ||
            encontrado.serviceUUIDs?.some(
              uuid => uuid.toLowerCase() === SERVICE_UUID
            )
          ) {
            setDispositivos(anteriores => {
              if (anteriores.some(d => d.id === encontrado.id)) {
                return anteriores;
              }

              return [
                ...anteriores,
                {
                  id: encontrado.id,
                  name: nome || 'Apollo',
                  device: encontrado,
                },
              ];
            });
          }
        }
      );

      setTimeout(() => {
        manager.stopDeviceScan();
        setProcurando(false);
        setMensagem('Busca finalizada.');
      }, 12000);
    } catch (erro) {
      console.error(erro);
      setProcurando(false);
      Alert.alert('Erro', 'Não foi possível procurar dispositivos.');
    }
  };

  const conectarSelecionado = item => {
    conectarRef.current?.(item);
  };

  const desconectar = async () => {
    try {
      manager.stopDeviceScan();
      await manager.cancelDeviceConnection(dispositivo?.id);
      setDispositivo(null);
      setMensagem('Desconectado');
      setAlertaSOS(false);
    } catch (erro) {
      console.error('Erro ao desconectar:', erro);
      Alert.alert('Erro', 'Não foi possível desconectar.');
    }
  };

  const Cartao = ({ titulo, valor, unidade = '' }) => (
    <View style={styles.cartaoMedicao}>
      <Text style={styles.rotulo}>{titulo}</Text>
      <Text style={styles.valor}>
        {valor === null || valor === undefined
          ? '--'
          : `${valor}${unidade}`}
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.conteudo}>
        <View style={styles.cabecalho}>
          <Ionicons name="bluetooth" size={42} color={C.branco} />
          <Text style={styles.titulo}>CONEXÃO BLUETOOTH</Text>
          <Text style={styles.subtitulo}>
            Monitoramento do dispositivo Apollo
          </Text>
        </View>

        <View style={styles.status}>
          <View
            style={[
              styles.ponto,
              dispositivo ? styles.pontoVerde : styles.pontoCinza,
            ]}
          />
          <View style={{ flex: 1 }}>
            <Text style={styles.statusTitulo}>
              {dispositivo?.name || 'Nenhum dispositivo conectado'}
            </Text>
            <Text style={styles.statusTexto}>{mensagem}</Text>
          </View>
        </View>

        {alertaSOS && (
          <View style={styles.alerta}>
            <Ionicons name="alert-circle" size={24} color={C.vermelho} />
            <Text style={styles.alertaTexto}>
              Alerta SOS recebido do dispositivo.
            </Text>
          </View>
        )}

        {!dispositivo ? (
          <TouchableOpacity
            style={styles.botao}
            onPress={procurar}
            disabled={procurando || conectando}
          >
            <Text style={styles.botaoTexto}>
              {procurando
                ? 'PROCURANDO...'
                : conectando
                  ? 'CONECTANDO...'
                  : 'PROCURAR APOLLO'}
            </Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.botao, styles.botaoDesconectar]}
            onPress={desconectar}
          >
            <Text style={styles.botaoTexto}>DESCONECTAR</Text>
          </TouchableOpacity>
        )}

        {dispositivos.map(item => (
          <TouchableOpacity
            key={item.id}
            style={styles.itemDispositivo}
            onPress={() => conectarSelecionado(item)}
            disabled={conectando || Boolean(dispositivo)}
          >
            <Ionicons name="watch-outline" size={25} color={C.azul} />
            <View style={{ flex: 1 }}>
              <Text style={styles.nomeDispositivo}>{item.name}</Text>
              <Text style={styles.idDispositivo}>{item.id}</Text>
            </View>
            <Ionicons name="chevron-forward" size={22} color={C.azul} />
          </TouchableOpacity>
        ))}

        <Text style={styles.secao}>ÚLTIMA MEDIÇÃO RECEBIDA</Text>

        <View style={styles.grade}>
          <Cartao
            titulo="Aceleração X"
            valor={medicao?.aceleracao_x}
          />
          <Cartao
            titulo="Aceleração Y"
            valor={medicao?.aceleracao_y}
          />
          <Cartao
            titulo="Aceleração Z"
            valor={medicao?.aceleracao_z}
          />
          <Cartao
            titulo="Giroscópio X"
            valor={medicao?.giroscopio_x}
          />
          <Cartao
            titulo="Giroscópio Y"
            valor={medicao?.giroscopio_y}
          />
          <Cartao
            titulo="Giroscópio Z"
            valor={medicao?.giroscopio_z}
          />
          <Cartao
            titulo="Intensidade sonora"
            valor={medicao?.intensidade_sonora}
          />
        </View>

        <Text style={styles.rodape}>
          Os dados são provenientes dos sensores do dispositivo. A intensidade
          sonora não é uma medição clínica de saúde.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F8FC',
  },
  conteudo: {
    padding: 20,
    paddingBottom: 35,
  },
  cabecalho: {
    alignItems: 'center',
    backgroundColor: C.azul,
    borderRadius: 22,
    padding: 24,
    marginBottom: 18,
  },
  titulo: {
    color: C.branco,
    fontSize: 19,
    fontWeight: 'bold',
    marginTop: 10,
  },
  subtitulo: {
    color: C.branco,
    fontSize: 13,
    textAlign: 'center',
    marginTop: 6,
  },
  status: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.branco,
    borderRadius: 15,
    padding: 15,
    marginBottom: 14,
    gap: 12,
  },
  ponto: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  pontoVerde: {
    backgroundColor: C.verde,
  },
  pontoCinza: {
    backgroundColor: C.cinza,
  },
  statusTitulo: {
    color: C.texto,
    fontWeight: 'bold',
    fontSize: 14,
  },
  statusTexto: {
    color: C.cinza,
    marginTop: 4,
    fontSize: 12,
  },
  botao: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: C.azul,
    padding: 16,
    borderRadius: 14,
    marginBottom: 18,
  },
  botaoDesconectar: {
    backgroundColor: C.vermelho,
  },
  botaoTexto: {
    color: C.branco,
    fontWeight: 'bold',
    fontSize: 14,
  },
  itemDispositivo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: C.branco,
    borderRadius: 14,
    padding: 15,
    marginBottom: 10,
  },
  nomeDispositivo: {
    color: C.texto,
    fontWeight: 'bold',
  },
  idDispositivo: {
    color: C.cinza,
    fontSize: 10,
    marginTop: 4,
  },
  secao: {
    color: C.texto,
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 10,
    marginBottom: 12,
  },
  grade: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  cartaoMedicao: {
    width: '48%',
    flexGrow: 1,
    backgroundColor: C.branco,
    borderRadius: 15,
    padding: 14,
    minHeight: 85,
  },
  rotulo: {
    color: C.cinza,
    fontSize: 12,
  },
  valor: {
    color: C.texto,
    fontWeight: 'bold',
    fontSize: 19,
    marginTop: 8,
  },
  alerta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#FCE8E8',
    padding: 14,
    borderRadius: 12,
    marginBottom: 15,
  },
  alertaTexto: {
    color: C.vermelho,
    flex: 1,
    fontWeight: 'bold',
  },
  rodape: {
    color: C.cinza,
    fontSize: 11,
    lineHeight: 17,
    marginTop: 18,
  },
});
