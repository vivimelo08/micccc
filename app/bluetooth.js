
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Easing,
  PermissionsAndroid,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { manager } from '../ble/manager';
import { Buffer } from 'buffer';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Os UUIDs precisam ser iguais aos definidos no código Arduino.
const UUID_SERVICO = '12345678-1234-1234-1234-1234567890ab';
const UUID_DADOS = '12345678-1234-1234-1234-1234567890ac';
const UUID_ALERTA = '12345678-1234-1234-1234-1234567890ad';

const NOME_PULSEIRA = 'Apollo';

const C = {
  texto: '#30364D',
  secundario: '#65708F',
  azul: '#5574B8',
  azulClaro: '#E9EDFA',
  roxo: '#899EEB',
  verde: '#55B878',
  amarelo: '#F0D060',
  branco: '#FFFFFF',
  vermelho: '#C65B69',
};

const GRADIENTE = [
  '#899EEB',
  '#AAB9EF',
  '#C8CFED',
  '#E3E1D2',
  '#FFF5B8',
];

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

// O firmware envia 7 números inteiros de 16 bits (14 bytes).
function interpretarDados(valorBase64) {
  const bytes = Buffer.from(valorBase64, 'base64');

  if (bytes.length < 14) {
    throw new Error(
      `Pacote incompleto: recebidos ${bytes.length} bytes; esperados 14.`
    );
  }

  const lerInt16 = (posicao) => {
    let valor = bytes[posicao] | (bytes[posicao + 1] << 8);

    if (valor & 0x8000) valor -= 0x10000;

    return valor;
  };

  return {
    aceleracao_x: lerInt16(0) / 1000,
    aceleracao_y: lerInt16(2) / 1000,
    aceleracao_z: lerInt16(4) / 1000,
    giroscopio_x: lerInt16(6) / 10,
    giroscopio_y: lerInt16(8) / 10,
    giroscopio_z: lerInt16(10) / 10,
    intensidade_sonora: lerInt16(12) / 10000,
    recebido_em: new Date().toLocaleTimeString('pt-BR'),
  };
}

function NavbarSuperior({ insets }) {
  return (
    <View style={[styles.topSafeArea, { paddingTop: insets.top }]}>
      <View style={styles.navbar}>
        <TouchableOpacity
          style={styles.botaoPerfil}
          onPress={() => router.push('/config')}
          accessibilityLabel="Abrir configurações"
        >
          <Ionicons name="settings-outline" size={24} color={C.texto} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.botaoPerfil}
          onPress={() => router.push('/perfil')}
          accessibilityLabel="Abrir perfil"
        >
          <Ionicons name="person-outline" size={24} color={C.texto} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

function NavbarInferior({ insets }) {
  const itens = [
    { texto: 'Início', icone: 'heart-outline', rota: '/batisono' },
    { texto: 'Questionário', icone: 'clipboard-outline', rota: '/quest' },
    { texto: 'Conexão', icone: 'bluetooth-outline', ativo: true },
    { texto: 'Dicas', icone: 'book-outline', rota: '/dicas' },
  ];

  return (
    <View
      style={[
        styles.bottomSafeArea,
        { paddingBottom: Math.max(insets.bottom, 4) },
      ]}
    >
      <View style={styles.bottomBar}>
        {itens.map((item) => (
          <TouchableOpacity
            key={item.texto}
            style={styles.navItem}
            accessibilityLabel={item.texto}
            onPress={() => item.rota && router.replace(item.rota)}
            activeOpacity={0.8}
          >
            <View style={[styles.navIcon, item.ativo && styles.navIconAtivo]}>
              <Ionicons name={item.icone} size={23} color={C.azul} />
            </View>
            <Text
              style={[
                styles.navTexto,
                item.ativo && styles.navTextoAtivo,
              ]}
            >
              {item.texto}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

function Decoracoes() {
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <View style={[styles.arc, styles.arc1]} />
      <View style={[styles.arc, styles.arc2]} />
      <View style={[styles.arc, styles.arc3]} />
      <View style={styles.brilho1} />
      <View style={styles.brilho2} />
    </View>
  );
}

function LinhaDado({ titulo, valor, unidade = '' }) {
  return (
    <View style={styles.linhaDado}>
      <Text style={styles.dadoTitulo}>{titulo}</Text>
      <Text style={styles.dadoValor}>
        {valor == null ? '--' : valor}
        {valor == null ? '' : unidade}
      </Text>
    </View>
  );
}

export default function Relogio() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const pequeno = width < 360;

  const [status, setStatus] = useState('idle');
  const [mensagem, setMensagem] = useState('');
  const [dados, setDados] = useState(null);
  const [alerta, setAlerta] = useState('');
  const [nomeDispositivo, setNomeDispositivo] = useState(NOME_PULSEIRA);

  const dispositivoRef = useRef(null);
  const monitorDadosRef = useRef(null);
  const monitorAlertaRef = useRef(null);
  const pulso = useRef(new Animated.Value(1)).current;
  const tentativaRef = useRef(false);

  useEffect(() => {
    return () => {
      tentativaRef.current = false;

      monitorDadosRef.current?.remove();
      monitorAlertaRef.current?.remove();

      if (dispositivoRef.current) {
        manager.cancelDeviceConnection(dispositivoRef.current.id).catch(() => {});
      }

      pulso.stopAnimation();
    };
  }, [pulso]);

  useEffect(() => {
    if (status !== 'connecting') {
      pulso.stopAnimation();
      pulso.setValue(1);
      return;
    }

    Animated.loop(
      Animated.sequence([
        Animated.timing(pulso, {
          toValue: 1.08,
          duration: 700,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulso, {
          toValue: 1,
          duration: 700,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();

    return () => pulso.stopAnimation();
  }, [status, pulso]);

  const limparMonitores = () => {
    monitorDadosRef.current?.remove();
    monitorDadosRef.current = null;

    monitorAlertaRef.current?.remove();
    monitorAlertaRef.current = null;
  };

  const desconectar = async (atualizarTela = true) => {
    limparMonitores();

    const dispositivo = dispositivoRef.current;
    dispositivoRef.current = null;
    tentativaRef.current = false;

    if (dispositivo) {
      try {
        await manager.cancelDeviceConnection(dispositivo.id);
      } catch {
        // A conexão pode já ter sido encerrada.
      }
    }

    if (atualizarTela) {
      setStatus('idle');
      setMensagem('');
      setDados(null);
      setAlerta('');
    }
  };

  const conectar = async () => {
    if (tentativaRef.current) return;

    tentativaRef.current = true;
    setStatus('connecting');
    setMensagem('Verificando permissões e procurando a pulseira...');
    setDados(null);
    setAlerta('');

    let encontrado = null;

    try {
      const permissao = await solicitarPermissoes();

      if (!permissao) {
        throw new Error(
          'Permissão Bluetooth negada. Autorize o acesso nas configurações do celular.'
        );
      }

      const estadoBluetooth = await manager.state();

      if (estadoBluetooth !== 'PoweredOn') {
        throw new Error(
          'Ative o Bluetooth do celular e tente novamente.'
        );
      }

      setMensagem(`Procurando ${NOME_PULSEIRA}...`);

      encontrado = await new Promise((resolve, reject) => {
        let finalizado = false;

        const encerrarBusca = () => {
          if (finalizado) return;
          finalizado = true;
          manager.stopDeviceScan();
        };

        const temporizador = setTimeout(() => {
          encerrarBusca();
          reject(
            new Error(
              `Não encontrei ${NOME_PULSEIRA}. Confira se a pulseira está ligada e próxima do celular.`
            )
          );
        }, 15000);

        manager.startDeviceScan(
          null,
          { allowDuplicates: false },
          (erro, dispositivo) => {
            if (erro) {
              clearTimeout(temporizador);
              encerrarBusca();
              reject(erro);
              return;
            }

            const nome = dispositivo?.name || dispositivo?.localName || '';

            if (nome.toLowerCase() === NOME_PULSEIRA.toLowerCase()) {
              clearTimeout(temporizador);
              encerrarBusca();
              resolve(dispositivo);
            }
          }
        );
      });

      setNomeDispositivo(encontrado.name || NOME_PULSEIRA);
      setMensagem('Dispositivo encontrado. Estabelecendo conexão...');

      const conectado = await encontrado.connect({
        timeout: 12000,
      });

      dispositivoRef.current = conectado;

      await conectado.discoverAllServicesAndCharacteristics();

      const servicos = await conectado.services();
      const servicoExiste = servicos.some(
        (servico) =>
          servico.uuid.toLowerCase() === UUID_SERVICO.toLowerCase()
      );

      if (!servicoExiste) {
        throw new Error(
          'Conectou ao dispositivo, mas o serviço esperado não foi encontrado. Confira os UUIDs do Arduino.'
        );
      }

      const caracteristicas = await conectado.characteristicsForService(
        UUID_SERVICO
      );

      const dadosExiste = caracteristicas.some(
        (caracteristica) =>
          caracteristica.uuid.toLowerCase() === UUID_DADOS.toLowerCase()
      );

      if (!dadosExiste) {
        throw new Error(
          'O serviço foi encontrado, mas a característica de dados não corresponde ao UUID configurado.'
        );
      }

      // Monitora a desconexão inesperada.
      conectado.onDisconnected((erro) => {
        limparMonitores();
        dispositivoRef.current = null;
        tentativaRef.current = false;
        setStatus('idle');
        setMensagem(
          erro
            ? `A conexão foi encerrada: ${erro.message}`
            : 'A pulseira foi desconectada.'
        );
      });

      // Recebe as sete medidas enviadas pelo Arduino.
      monitorDadosRef.current = manager.monitorCharacteristicForDevice(
        conectado.id,
        UUID_SERVICO,
        UUID_DADOS,
        (erro, caracteristica) => {
          if (erro) {
            setMensagem(`Erro ao receber dados: ${erro.message}`);
            return;
          }

          if (!caracteristica?.value) return;

          try {
            const leitura = interpretarDados(caracteristica.value);
            setDados(leitura);
            setMensagem('Conectada e recebendo dados dos sensores.');
          } catch (erroLeitura) {
            setMensagem(erroLeitura.message);
          }
        }
      );

      // Recebe mensagens de alerta, como SOS.
      const alertaExiste = caracteristicas.some(
        (caracteristica) =>
          caracteristica.uuid.toLowerCase() === UUID_ALERTA.toLowerCase()
      );

      if (alertaExiste) {
        monitorAlertaRef.current = manager.monitorCharacteristicForDevice(
          conectado.id,
          UUID_SERVICO,
          UUID_ALERTA,
          (erro, caracteristica) => {
            if (erro || !caracteristica?.value) return;

            const mensagemAlerta = Buffer.from(
              caracteristica.value,
              'base64'
            ).toString('utf8');

            setAlerta(mensagemAlerta);
          }
        );
      }

      setStatus('connected');
      setMensagem(
        'Conectada! Aguardando a primeira leitura dos sensores...'
      );
    } catch (erro) {
      manager.stopDeviceScan();

      if (encontrado) {
        try {
          await manager.cancelDeviceConnection(encontrado.id);
        } catch {
          // Ignora falha ao encerrar uma conexão incompleta.
        }
      }

      dispositivoRef.current = null;
      limparMonitores();

      setStatus('error');
      setMensagem(erro?.message || 'Não foi possível conectar à pulseira.');
    } finally {
      tentativaRef.current = false;
    }
  };

  const irParaMonitoramento = () => {
    router.replace('/batisono');
  };

  const tamanho = pequeno ? 130 : 150;

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={GRADIENTE}
        locations={[0, 0.25, 0.52, 0.78, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      <Decoracoes />
      <NavbarSuperior insets={insets} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingHorizontal: pequeno ? 18 : 25,
            paddingBottom: 24,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.conteudo}>
          <Text style={[styles.titulo, pequeno && styles.tituloPequeno]}>
            VAMOS CONECTAR
          </Text>
          <Text style={[styles.titulo, pequeno && styles.tituloPequeno]}>
            SUA PULSEIRA
          </Text>

          <Animated.View
            style={[
              styles.relogioContainer,
              { transform: [{ scale: status === 'connecting' ? pulso : 1 }] },
            ]}
          >
            <View
              style={[
                styles.relogio,
                { width: tamanho, height: tamanho, borderRadius: tamanho / 2 },
                status === 'connected' && styles.relogioConectado,
                status === 'error' && styles.relogioErro,
              ]}
            >
              {status === 'connecting' ? (
                <ActivityIndicator size="large" color={C.texto} />
              ) : (
                <Ionicons
                  name="watch-outline"
                  size={pequeno ? 76 : 90}
                  color={status === 'connected' ? C.branco : C.texto}
                />
              )}
            </View>

            {status === 'connected' && (
              <View style={styles.confirmacao}>
                <Ionicons name="checkmark" size={28} color={C.branco} />
              </View>
            )}
          </Animated.View>

          <Text style={[styles.instrucao, pequeno && styles.instrucaoPequena]}>
            {status === 'idle' &&
              'Conecte a pulseira Apollo ao Sunny Health para receber os dados dos sensores.'}
            {status === 'connecting' && 'Procurando e conectando à pulseira...'}
            {status === 'connected' && `${nomeDispositivo} está conectada.`}
            {status === 'error' && 'Não foi possível conectar a pulseira.'}
          </Text>

          {status !== 'connected' && (
            <View style={styles.passos}>
              {[
                'Ligue a pulseira e mantenha-a perto do celular.',
                'Ative o Bluetooth do celular.',
                'Toque em "Conectar pulseira" e aguarde.',
              ].map((texto, index) => (
                <View key={texto} style={styles.passo}>
                  <View style={styles.numero}>
                    <Text style={styles.numeroTexto}>{index + 1}</Text>
                  </View>
                  <Text style={styles.passoTexto}>{texto}</Text>
                </View>
              ))}
            </View>
          )}

          <View style={styles.statusContainer}>
            <View
              style={[
                styles.ponto,
                status === 'connecting' && styles.pontoConectando,
                status === 'connected' && styles.pontoConectado,
                status === 'error' && styles.pontoErro,
              ]}
            />
            <Text style={styles.statusTexto}>
              {status === 'idle' && 'Bluetooth desconectado'}
              {status === 'connecting' && 'Procurando / conectando...'}
              {status === 'connected' && 'Bluetooth conectado'}
              {status === 'error' && 'Falha na conexão'}
            </Text>
          </View>

          {!!mensagem && (
            <Text style={styles.mensagem}>{mensagem}</Text>
          )}

          {status !== 'connected' ? (
            <TouchableOpacity
              style={[
                styles.botaoConectar,
                status === 'connecting' && styles.botaoConectando,
              ]}
              onPress={conectar}
              disabled={status === 'connecting'}
              activeOpacity={0.85}
            >
              <Ionicons
                name="bluetooth-outline"
                size={27}
                color={C.branco}
              />
              <Text
                style={[
                  styles.botaoTexto,
                  pequeno && styles.botaoTextoPequeno,
                ]}
              >
                {status === 'connecting'
                  ? 'CONECTANDO...'
                  : status === 'error'
                    ? 'TENTAR NOVAMENTE'
                    : 'CONECTAR PULSEIRA'}
              </Text>
            </TouchableOpacity>
          ) : (
            <>
              <View style={styles.cartaoDados}>
                <Text style={styles.cartaoTitulo}>Última leitura recebida</Text>
                <Text style={styles.horario}>
                  {dados?.recebido_em
                    ? `Recebida às ${dados.recebido_em}`
                    : 'Aguardando dados do dispositivo...'}
                </Text>

                <Text style={styles.grupoTitulo}>Acelerômetro</Text>
                <LinhaDado titulo="Eixo X" valor={dados?.aceleracao_x?.toFixed(3)} />
                <LinhaDado titulo="Eixo Y" valor={dados?.aceleracao_y?.toFixed(3)} />
                <LinhaDado titulo="Eixo Z" valor={dados?.aceleracao_z?.toFixed(3)} />

                <Text style={styles.grupoTitulo}>Giroscópio</Text>
                <LinhaDado titulo="Eixo X" valor={dados?.giroscopio_x?.toFixed(1)} />
                <LinhaDado titulo="Eixo Y" valor={dados?.giroscopio_y?.toFixed(1)} />
                <LinhaDado titulo="Eixo Z" valor={dados?.giroscopio_z?.toFixed(1)} />

                <Text style={styles.grupoTitulo}>Microfone</Text>
                <LinhaDado
                  titulo="Sinal sonoro normalizado"
                  valor={dados?.intensidade_sonora?.toFixed(4)}
                />

                {!!alerta && (
                  <View style={styles.alerta}>
                    <Ionicons
                      name="alert-circle-outline"
                      size={22}
                      color={C.vermelho}
                    />
                    <Text style={styles.alertaTexto}>
                      Alerta recebido: {alerta}
                    </Text>
                  </View>
                )}

                <Text style={styles.nota}>
                  Leituras brutas dos sensores. Elas não representam,
                  por si só, diagnóstico de tremores ou outros sintomas.
                </Text>
              </View>

              <TouchableOpacity
                style={styles.botaoMonitorar}
                onPress={irParaMonitoramento}
                activeOpacity={0.85}
              >
                <Ionicons
                  name="pulse-outline"
                  size={23}
                  color={C.branco}
                />
                <Text style={styles.botaoTexto}>
                  IR PARA MONITORAMENTO
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.botaoDesconectar}
                onPress={() => desconectar(true)}
                activeOpacity={0.85}
              >
                <Ionicons
                  name="bluetooth-outline"
                  size={20}
                  color={C.vermelho}
                />
                <Text style={styles.textoDesconectar}>Desconectar pulseira</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </ScrollView>

      <NavbarInferior insets={insets} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, overflow: 'hidden' },
  scroll: { flex: 1 },
  scrollContent: { flexGrow: 1 },
  conteudo: {
    width: '100%',
    maxWidth: 520,
    alignSelf: 'center',
    alignItems: 'center',
    paddingTop: 22,
    paddingBottom: 12,
  },

  topSafeArea: {
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderBottomLeftRadius: 22,
    borderBottomRightRadius: 22,
    zIndex: 2,
    marginHorizontal: -17,
  },
  navbar: {
    minHeight: 75,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  botaoPerfil: {
    width: 55,
    height: 55,
    borderRadius: 21,
    backgroundColor: '#C9C3E6',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 10,
  },

  bottomSafeArea: {
    backgroundColor: 'rgba(255,255,255,0.97)',
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    paddingTop: 8,
    shadowColor: '#30364D',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 8,
    marginHorizontal: -17,
  },
  bottomBar: {
    minHeight: 59,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 5,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
    gap: 3,
  },
  navIcon: {
    width: 37,
    height: 32,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navIconAtivo: { backgroundColor: '#E9EDFA' },
  navTexto: {
    color: '#65708F',
    fontSize: 9,
    fontWeight: '600',
    textAlign: 'center',
  },
  navTextoAtivo: { color: '#30364D', fontWeight: '800' },

  arc: {
    position: 'absolute',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.20)',
    borderRadius: 300,
  },
  arc1: { width: 480, height: 480, top: -210, right: -180 },
  arc2: {
    width: 390,
    height: 390,
    top: 180,
    left: -230,
    borderColor: 'rgba(255,255,255,0.14)',
  },
  arc3: {
    width: 600,
    height: 600,
    bottom: -350,
    right: -280,
    borderColor: 'rgba(255,255,255,0.17)',
  },
  brilho1: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(255,255,255,0.08)',
    top: 70,
    right: -80,
  },
  brilho2: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(255,245,184,0.12)',
    bottom: 180,
    left: -70,
  },

  titulo: {
    fontSize: 34,
    fontWeight: '800',
    color: C.branco,
    textAlign: 'center',
    letterSpacing: 0.5,
    lineHeight: 42,
  },
  tituloPequeno: { fontSize: 29, lineHeight: 36 },
  relogioContainer: {
    position: 'relative',
    marginTop: 25,
    marginBottom: 20,
  },
  relogio: {
    backgroundColor: 'rgba(255,255,255,0.82)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: C.texto,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  relogioConectado: { backgroundColor: C.verde },
  relogioErro: { backgroundColor: '#FBECEF' },
  confirmacao: {
    position: 'absolute',
    right: -5,
    bottom: 0,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: C.verde,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: C.branco,
  },

  instrucao: {
    width: '100%',
    maxWidth: 400,
    fontSize: 19,
    lineHeight: 27,
    color: C.texto,
    textAlign: 'center',
    fontWeight: '500',
    marginBottom: 20,
  },
  instrucaoPequena: { fontSize: 17, lineHeight: 24 },
  passos: {
    width: '100%',
    backgroundColor: 'rgba(255,255,255,0.70)',
    borderRadius: 18,
    padding: 17,
    marginBottom: 17,
  },
  passo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  numero: {
    width: 34,
    height: 34,
    flexShrink: 0,
    borderRadius: 17,
    backgroundColor: C.roxo,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  numeroTexto: { color: C.branco, fontSize: 17, fontWeight: '800' },
  passoTexto: { flex: 1, color: C.texto, fontSize: 16, lineHeight: 21 },

  statusContainer: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    paddingHorizontal: 8,
  },
  ponto: {
    width: 13,
    height: 13,
    flexShrink: 0,
    borderRadius: 7,
    backgroundColor: C.amarelo,
    marginRight: 9,
  },
  pontoConectando: { backgroundColor: C.roxo },
  pontoConectado: { backgroundColor: C.verde },
  pontoErro: { backgroundColor: C.vermelho },
  statusTexto: {
    flexShrink: 1,
    fontSize: 16,
    fontWeight: '700',
    color: C.texto,
    textAlign: 'center',
  },
  mensagem: {
    width: '100%',
    color: C.texto,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: 15,
  },

  botaoConectar: {
    width: '100%',
    minHeight: 67,
    borderRadius: 18,
    backgroundColor: C.azul,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 18,
    gap: 10,
    shadowColor: C.texto,
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  botaoConectando: { backgroundColor: C.roxo },
  botaoTexto: {
    flexShrink: 1,
    color: C.branco,
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.4,
    textAlign: 'center',
  },
  botaoTextoPequeno: { fontSize: 14 },

  cartaoDados: {
    width: '100%',
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderRadius: 20,
    padding: 18,
    marginBottom: 16,
  },
  cartaoTitulo: {
    color: C.texto,
    fontSize: 19,
    fontWeight: '800',
    marginBottom: 5,
  },
  horario: {
    color: C.secundario,
    fontSize: 13,
    marginBottom: 15,
  },
  grupoTitulo: {
    color: C.azul,
    fontSize: 15,
    fontWeight: '800',
    marginTop: 12,
    marginBottom: 5,
  },
  linhaDado: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 7,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#DDE2F0',
    gap: 12,
  },
  dadoTitulo: {
    flex: 1,
    color: C.secundario,
    fontSize: 14,
  },
  dadoValor: {
    color: C.texto,
    fontSize: 14,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  nota: {
    color: C.secundario,
    fontSize: 12,
    lineHeight: 18,
    marginTop: 15,
  },
  alerta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FBECEF',
    borderRadius: 12,
    padding: 12,
    marginTop: 14,
  },
  alertaTexto: {
    flex: 1,
    color: C.vermelho,
    fontSize: 14,
    fontWeight: '700',
  },
  botaoMonitorar: {
    width: '100%',
    minHeight: 60,
    borderRadius: 18,
    backgroundColor: C.azul,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 15,
    gap: 9,
    marginBottom: 12,
  },
  botaoDesconectar: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 12,
    gap: 8,
  },
  textoDesconectar: {
    color: C.vermelho,
    fontWeight: '700',
    fontSize: 14,
  },
});
