
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';

import {
  getDatabase,
  buscarUltimaMedicaoApollo,
  buscarUltimoBatimento,
} from '../database/database';

const C = {
  fundo: '#C9C3E6',
  branco: '#FFFFFF',
  texto: '#30364D',
  secundario: '#65708F',
  azul: '#5574B8',
  azulClaro: '#E9EDFA',
  rosa: '#C65B69',
  rosaClaro: '#FBECEF',
  verde: '#4B8B76',
  borda: '#E7EAF4',
  roxo: '#7A6BB5',
};

export default function BatiSono() {
  const insets = useSafeAreaInsets();

  const [dadosQuestionario, setDadosQuestionario] = useState(null);
  const [medicaoApollo, setMedicaoApollo] = useState(null);
  const [batimento, setBatimento] = useState(null);
  const [carregandoDados, setCarregandoDados] = useState(true);

  // =========================================================
  // BUSCAR QUESTIONÁRIO E MEDIÇÕES DO APOLLO
  // Atualiza enquanto esta tela estiver em foco.
  // =========================================================

  const buscarDados = useCallback(async () => {
    try {
      const db = await getDatabase();

      const sessao = await db.getFirstAsync(`
        SELECT usuario_id
        FROM sessao
        WHERE id = 1
        LIMIT 1
      `);

      if (!sessao?.usuario_id) {
        setDadosQuestionario(null);
        setMedicaoApollo(null);
        setBatimento(null);
        return;
      }

      // Último questionário do usuário.
      const questionario = await db.getFirstAsync(
        `SELECT
          id,
          usuario_id,
          horas_sono,
          qualidade_sono,
          despertares,
          dificuldade_dormir,
          descanso,
          criado_em
        FROM questionarios
        WHERE usuario_id = ?
        ORDER BY id DESC
        LIMIT 1`,
        sessao.usuario_id
      );

      setDadosQuestionario(questionario || null);

      // Última medição gravada pelo bluetooth.js.
      const medicao = await buscarUltimaMedicaoApollo();

      setMedicaoApollo(medicao || null);

      // Último batimento gravado pelo sensor BLE (tela /frequencia).
      setBatimento((await buscarUltimoBatimento()) || null);
    } catch (error) {
      console.error('Erro ao atualizar a tela de monitoramento:', error);
    } finally {
      setCarregandoDados(false);
    }
  }, []);

  // Consulta ao entrar na tela e atualiza a cada 2 segundos.
  useFocusEffect(
    useCallback(() => {
      let ativo = true;

      const atualizar = async () => {
        if (ativo) {
          await buscarDados();
        }
      };

      atualizar();

      const intervalo = setInterval(atualizar, 2000);

      return () => {
        ativo = false;
        clearInterval(intervalo);
      };
    }, [buscarDados])
  );

  const navegar = rota => router.push(rota);

  // =========================================================
  // TRADUÇÕES DAS RESPOSTAS DO QUESTIONÁRIO
  // =========================================================

  const horasSonoOpcoes = {
    1: 'Menos de 5 horas',
    2: '5 a 6 horas',
    3: '6 a 7 horas',
    4: '7 a 8 horas',
    5: 'Mais de 8 horas',
  };

  const qualidadeSonoOpcoes = {
    1: 'Muito ruim',
    2: 'Ruim',
    3: 'Regular',
    4: 'Boa',
    5: 'Muito boa',
  };

  const despertaresOpcoes = {
    1: 'Nunca',
    2: 'Raramente',
    3: 'Às vezes',
    4: 'Frequentemente',
    5: 'Todas as noites',
  };

  const dificuldadeOpcoes = {
    1: 'Nunca',
    2: 'Raramente',
    3: 'Às vezes',
    4: 'Frequentemente',
  };

  const descansoOpcoes = {
    1: 'Nunca',
    2: 'Raramente',
    3: 'Às vezes',
    4: 'Na maioria das vezes',
    5: 'Sempre',
  };

  const textoOpcao = (opcoes, valor) =>
    valor != null ? opcoes[valor] || '--' : '--';

  const porcentagem = (valor, maximo = 5) =>
    valor == null
      ? 0
      : Math.round((Number(valor) / maximo) * 100);

  // =========================================================
  // FORMATAR DADOS RECEBIDOS DO APOLLO
  // =========================================================

  const formatarValor = valor => {
    if (valor === null || valor === undefined) {
      return '--';
    }

    const numero = Number(valor);

    return Number.isFinite(numero) ? numero.toFixed(3) : '--';
  };

  const dataRecebimento = medicaoApollo?.recebido_em
    ? new Date(medicaoApollo.recebido_em).toLocaleString('pt-BR')
    : null;

  // =========================================================
  // COMPONENTES VISUAIS
  // =========================================================

  const indicadorSono = (
    icone,
    titulo,
    valor,
    percentual,
    cor
  ) => (
    <View style={styles.indicadorSono} key={titulo}>
      <View
        style={[
          styles.miniIcone,
          { backgroundColor: `${cor}18` },
        ]}
      >
        <Ionicons name={icone} size={19} color={cor} />
      </View>

      <View style={styles.indicadorSonoTexto}>
        <Text style={styles.indicadorSonoTitulo}>{titulo}</Text>
        <Text style={styles.indicadorSonoValor}>{valor}</Text>

        <View style={styles.trilho}>
          <View
            style={[
              styles.trilhoPreenchido,
              {
                width: `${percentual}%`,
                backgroundColor: cor,
              },
            ]}
          />
        </View>
      </View>
    </View>
  );

  const cartaoSensor = (titulo, valor, icone) => (
    <View style={styles.cartaoSensor} key={titulo}>
      <Ionicons name={icone} size={23} color={C.azul} />
      <Text style={styles.sensorTitulo}>{titulo}</Text>
      <Text style={styles.sensorValor}>{valor}</Text>
    </View>
  );

  // =========================================================
  // DADOS DO QUESTIONÁRIO
  // =========================================================

  const horasSono = dadosQuestionario?.horas_sono ?? null;
  const qualidadeSono = dadosQuestionario?.qualidade_sono ?? null;
  const despertares = dadosQuestionario?.despertares ?? null;
  const dificuldadeDormir =
    dadosQuestionario?.dificuldade_dormir ?? null;
  const descanso = dadosQuestionario?.descanso ?? null;

  return (
    <View style={styles.safeArea}>
      <View style={styles.container}>
        <View pointerEvents="none" style={styles.glowOne} />
        <View pointerEvents="none" style={styles.glowTwo} />

        {/* CABEÇALHO */}

        <View
          style={[
            styles.topSafeArea,
            { paddingTop: insets.top },
          ]}
        >
          <View style={styles.navbar}>
            <TouchableOpacity
              style={styles.botaoPerfil}
              onPress={() => navegar('/config')}
              accessibilityLabel="Abrir configurações"
            >
              <Ionicons
                name="settings-outline"
                size={24}
                color={C.texto}
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.botaoPerfil}
              onPress={() => navegar('/perfil')}
              accessibilityLabel="Abrir perfil"
            >
              <Ionicons
                name="person-outline"
                size={24}
                color={C.texto}
              />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.conteudoPrincipal}>
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            <View style={styles.tituloPagina}>
              <Text style={styles.titulo}>Seja bem-vindo(a)!</Text>

              <Text style={styles.subtituloPagina}>
                Acompanhe os dados recebidos pelo Apollo e as informações
                do seu sono.
              </Text>
            </View>

            {/* =================================================
                CARTÃO DE BATIMENTOS
            ================================================= */}

            <View style={styles.card}>
              <View style={styles.cardCabecalho}>
                <View
                  style={[
                    styles.iconeCard,
                    styles.iconeBatimentos,
                  ]}
                >
                  <Ionicons
                    name="heart"
                    size={27}
                    color={C.rosa}
                  />
                </View>

                <View style={styles.cardTituloArea}>
                  <Text style={styles.cardTitulo}>
                    Batimentos cardíacos
                  </Text>

                  <Text style={styles.cardDescricao}>
                    Frequência cardíaca
                  </Text>
                </View>
              </View>

              <View style={styles.valorPrincipalBox}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.label}>
                    Frequência cardíaca
                  </Text>

                  <View style={styles.linhaValor}>
                    <Text style={styles.valorGrande}>
                      {batimento?.bpm ?? '--'}
                    </Text>
                    <Text style={styles.unidade}>bpm</Text>
                  </View>

                  <Text style={styles.textoAguardando}>
                    {batimento
                      ? `Última leitura: ${new Date(batimento.recebido_em).toLocaleString('pt-BR')}`
                      : 'Nenhuma leitura ainda. Conecte um sensor de batimentos.'}
                  </Text>

                  <TouchableOpacity
                    onPress={() => navegar('/frequencia')}
                    accessibilityLabel="Conectar sensor de batimentos"
                    style={{ marginTop: 8 }}
                  >
                    <Text style={{ color: C.azul, fontWeight: '700' }}>
                      Conectar sensor
                    </Text>
                  </TouchableOpacity>
                </View>

                <View
                  style={[
                    styles.iconeValor,
                    { backgroundColor: C.rosaClaro },
                  ]}
                >
                  <Ionicons
                    name="pulse-outline"
                    size={30}
                    color={C.rosa}
                  />
                </View>
              </View>
            </View>

            {/* =================================================
                CARTÃO DE SONO
            ================================================= */}

            <View style={styles.card}>
              <View style={styles.cardCabecalho}>
                <View
                  style={[
                    styles.iconeCard,
                    styles.iconeSono,
                  ]}
                >
                  <Ionicons
                    name="moon"
                    size={27}
                    color={C.roxo}
                  />
                </View>

                <View style={styles.cardTituloArea}>
                  <Text style={styles.cardTitulo}>
                    Sono e descanso
                  </Text>

                  <Text style={styles.cardDescricao}>
                    Informações do último questionário respondido.
                  </Text>
                </View>
              </View>

              {carregandoDados ? (
                <View style={styles.estadoCarregando}>
                  <ActivityIndicator size="small" color={C.azul} />
                  <Text style={styles.textoAguardando}>
                    Carregando dados...
                  </Text>
                </View>
              ) : dadosQuestionario ? (
                <>
                  <View style={styles.resumoSono}>
                    <View style={styles.resumoSonoIcone}>
                      <Ionicons
                        name="bed-outline"
                        size={24}
                        color={C.roxo}
                      />
                    </View>

                    <View style={styles.resumoSonoTexto}>
                      <Text style={styles.label}>
                        Duração do sono
                      </Text>

                      <Text style={styles.resumoSonoValor}>
                        {textoOpcao(horasSonoOpcoes, horasSono)}
                      </Text>
                    </View>
                  </View>

                  {indicadorSono(
                    'star-outline',
                    'Qualidade do sono',
                    textoOpcao(qualidadeSonoOpcoes, qualidadeSono),
                    porcentagem(qualidadeSono),
                    C.roxo
                  )}

                  {indicadorSono(
                    'sunny-outline',
                    'Sensação de descanso',
                    textoOpcao(descansoOpcoes, descanso),
                    porcentagem(descanso),
                    C.verde
                  )}

                  {indicadorSono(
                    'eye-outline',
                    'Despertares durante a noite',
                    textoOpcao(despertaresOpcoes, despertares),
                    porcentagem(despertares),
                    '#C58A36'
                  )}

                  {indicadorSono(
                    'time-outline',
                    'Dificuldade para dormir',
                    textoOpcao(dificuldadeOpcoes, dificuldadeDormir),
                    porcentagem(dificuldadeDormir, 4),
                    C.rosa
                  )}

                  <Text style={styles.textoAguardando}>
                    Estas informações vêm do questionário, não de uma
                    medição do sono realizada pelo Apollo.
                  </Text>
                </>
              ) : (
                <View style={styles.estadoVazio}>
                  <Ionicons
                    name="document-text-outline"
                    size={32}
                    color={C.azul}
                  />

                  <Text style={styles.estadoVazioTitulo}>
                    Nenhum questionário encontrado
                  </Text>

                  <Text style={styles.estadoVazioDescricao}>
                    Responda ao questionário para visualizar suas
                    informações de sono.
                  </Text>

                  <TouchableOpacity
                    style={styles.botaoSecundario}
                    onPress={() => navegar('/quest')}
                  >
                    <Text style={styles.botaoSecundarioTexto}>
                      Responder questionário
                    </Text>

                    <Ionicons
                      name="arrow-forward"
                      size={17}
                      color={C.azul}
                    />
                  </TouchableOpacity>
                </View>
              )}
            </View>

            {/* =================================================
                CARTÃO DE SENSORES REAIS DO APOLLO
            ================================================= */}

            <View style={styles.card}>
              <View style={styles.cardCabecalho}>
                <View
                  style={[
                    styles.iconeCard,
                    styles.iconeTremor,
                  ]}
                >
                  <Ionicons
                    name="hardware-chip-outline"
                    size={27}
                    color={C.azul}
                  />
                </View>

                <View style={styles.cardTituloArea}>
                  <Text style={styles.cardTitulo}>
                    Sensores de movimento
                  </Text>

                  <Text style={styles.cardDescricao}>
                    Dados recebidos pelo Bluetooth e salvos no SQLite.
                  </Text>
                </View>
              </View>

              <View style={styles.statusConexao}>
                <Ionicons
                  name={medicaoApollo ? 'checkmark-circle' : 'time-outline'}
                  size={20}
                  color={medicaoApollo ? C.verde : C.secundario}
                />

                <Text style={styles.statusConexaoTexto}>
                  {medicaoApollo
                    ? 'Medição encontrada no banco'
                    : 'Nenhuma medição salva ainda'}
                </Text>
              </View>

              <Text style={styles.subsecao}>ACELERÔMETRO</Text>

              <View style={styles.gradeSensores}>
                {cartaoSensor(
                  'Aceleração X',
                  formatarValor(medicaoApollo?.aceleracao_x),
                  'swap-horizontal-outline'
                )}

                {cartaoSensor(
                  'Aceleração Y',
                  formatarValor(medicaoApollo?.aceleracao_y),
                  'swap-vertical-outline'
                )}

                {cartaoSensor(
                  'Aceleração Z',
                  formatarValor(medicaoApollo?.aceleracao_z),
                  'move-outline'
                )}
              </View>

              <Text style={styles.subsecao}>GIROSCÓPIO</Text>

              <View style={styles.gradeSensores}>
                {cartaoSensor(
                  'Giroscópio X',
                  formatarValor(medicaoApollo?.giroscopio_x),
                  'sync-outline'
                )}

                {cartaoSensor(
                  'Giroscópio Y',
                  formatarValor(medicaoApollo?.giroscopio_y),
                  'sync-outline'
                )}

                {cartaoSensor(
                  'Giroscópio Z',
                  formatarValor(medicaoApollo?.giroscopio_z),
                  'sync-outline'
                )}
              </View>

              <View style={styles.somBox}>
                <Ionicons
                  name="volume-high-outline"
                  size={24}
                  color={C.roxo}
                />

                <View style={{ flex: 1 }}>
                  <Text style={styles.label}>
                    Intensidade sonora
                  </Text>

                  <Text style={styles.valorSom}>
                    {formatarValor(medicaoApollo?.intensidade_sonora)}
                  </Text>
                </View>
              </View>

              <Text style={styles.textoAguardando}>
                {dataRecebimento
                  ? `Último registro: ${dataRecebimento}`
                  : 'Os valores aparecerão depois que o Apollo enviar e salvar uma medição.'}
              </Text>

              <TouchableOpacity
                style={styles.botaoSecundario}
                onPress={() => navegar('/bluetooth')}
              >
                <Ionicons
                  name="bluetooth-outline"
                  size={19}
                  color={C.azul}
                />

                <Text style={styles.botaoSecundarioTexto}>
                  Abrir conexão Bluetooth
                </Text>
              </TouchableOpacity>
            </View>

            {/* =================================================
                TREMORES E MOVIMENTOS
            ================================================= */}

            <View style={styles.card}>
              <View style={styles.cardCabecalho}>
                <View
                  style={[
                    styles.iconeCard,
                    styles.iconeTremor,
                  ]}
                >
                  <Ionicons
                    name="hand-left-outline"
                    size={27}
                    color={C.azul}
                  />
                </View>

                <View style={styles.cardTituloArea}>
                  <Text style={styles.cardTitulo}>
                    Análise de movimentos
                  </Text>

                  <Text style={styles.cardDescricao}>
                    Informações que ainda precisam ser calculadas por
                    algoritmos específicos.
                  </Text>
                </View>
              </View>

              <View style={styles.aviso}>
                <Ionicons
                  name="information-circle-outline"
                  size={23}
                  color={C.azul}
                />

                <Text style={styles.avisoTexto}>
                  O acelerômetro e o giroscópio fornecem dados de movimento,
                  mas o código atual ainda não calcula percentual de tremor,
                  número de episódios, freezing ou bradicinesia. Por isso,
                  esses indicadores não são estimados nesta tela.
                </Text>
              </View>
            </View>
          </ScrollView>
        </View>

        {/* NAVBAR */}

        <View
          style={[
            styles.bottomSafeArea,
            { paddingBottom: insets.bottom },
          ]}
        >
          <View style={styles.bottomBar}>
            <TouchableOpacity
              style={styles.navItem}
              onPress={() => navegar('/batisono')}
            >
              <View style={[styles.navIcon, styles.navIconAtivo]}>
                <Ionicons name="heart" size={23} color={C.texto} />
              </View>
              <Text style={[styles.navTexto, styles.navTextoAtivo]}>
                Monitorar
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.navItem}
              onPress={() => navegar('/quest')}
            >
              <View style={styles.navIcon}>
                <Ionicons
                  name="clipboard-outline"
                  size={23}
                  color={C.azul}
                />
              </View>
              <Text style={styles.navTexto}>Questionário</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.navItem}
              onPress={() => navegar('/bluetooth')}
            >
              <View style={styles.navIcon}>
                <Ionicons
                  name="bluetooth-outline"
                  size={23}
                  color={C.azul}
                />
              </View>
              <Text style={styles.navTexto}>Relógio</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.navItem}
              onPress={() => navegar('/dicas')}
            >
              <View style={styles.navIcon}>
                <Ionicons
                  name="book-outline"
                  size={23}
                  color={C.azul}
                />
              </View>
              <Text style={styles.navTexto}>Dicas</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
}

// ============================================================
// ESTILOS
// ============================================================

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#30364D',
  },
  container: {
    flex: 1,
    backgroundColor: '#B8C5E8',
    overflow: 'hidden',
  },
  glowOne: {
    position: 'absolute',
    top: 120,
    right: -55,
    width: 190,
    height: 190,
    borderRadius: 95,
    backgroundColor: '#E5E1F5',
    opacity: 0.7,
  },
  glowTwo: {
    position: 'absolute',
    bottom: 115,
    left: -75,
    width: 210,
    height: 210,
    borderRadius: 105,
    backgroundColor: '#B8C5E8',
    opacity: 0.35,
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
  conteudoPrincipal: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 17,
    paddingTop: 20,
    paddingBottom: 14,
  },
  tituloPagina: {
    marginBottom: 18,
    paddingHorizontal: 3,
  },
  titulo: {
    color: C.texto,
    fontSize: 27,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  subtituloPagina: {
    color: C.texto,
    fontSize: 14,
    lineHeight: 20,
    marginTop: 5,
  },
  card: {
    backgroundColor: C.branco,
    borderRadius: 22,
    padding: 17,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.8)',
    shadowColor: '#30364D',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.07,
    shadowRadius: 10,
    elevation: 3,
  },
  cardCabecalho: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 17,
  },
  iconeCard: {
    width: 49,
    height: 49,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  iconeBatimentos: {
    backgroundColor: C.rosaClaro,
  },
  iconeSono: {
    backgroundColor: '#F0EDFA',
  },
  iconeTremor: {
    backgroundColor: C.azulClaro,
  },
  cardTituloArea: {
    flex: 1,
  },
  cardTitulo: {
    color: C.texto,
    fontSize: 16,
    fontWeight: '800',
  },
  cardDescricao: {
    color: C.secundario,
    fontSize: 12,
    lineHeight: 17,
    marginTop: 3,
  },
  valorPrincipalBox: {
    backgroundColor: '#F8F9FD',
    borderRadius: 17,
    padding: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 13,
  },
  label: {
    color: C.secundario,
    fontSize: 12,
    fontWeight: '600',
  },
  linhaValor: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: 3,
  },
  valorGrande: {
    color: C.texto,
    fontSize: 34,
    lineHeight: 40,
    fontWeight: '800',
  },
  unidade: {
    color: C.secundario,
    fontSize: 14,
    marginLeft: 6,
    fontWeight: '600',
  },
  textoAguardando: {
    color: C.secundario,
    fontSize: 11,
    marginTop: 8,
    lineHeight: 16,
  },
  iconeValor: {
    width: 54,
    height: 54,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 10,
  },
  estadoCarregando: {
    minHeight: 100,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
  },
  resumoSono: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F7FC',
    borderRadius: 15,
    padding: 12,
    marginBottom: 12,
  },
  resumoSonoIcone: {
    width: 43,
    height: 43,
    borderRadius: 14,
    backgroundColor: '#F0EDFA',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 11,
  },
  resumoSonoTexto: {
    flex: 1,
  },
  resumoSonoValor: {
    color: C.texto,
    fontSize: 14,
    fontWeight: '800',
    marginTop: 4,
  },
  indicadorSono: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F1F7',
  },
  miniIcone: {
    width: 37,
    height: 37,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  indicadorSonoTexto: {
    flex: 1,
  },
  indicadorSonoTitulo: {
    color: C.secundario,
    fontSize: 11,
    fontWeight: '600',
  },
  indicadorSonoValor: {
    color: C.texto,
    fontSize: 13,
    fontWeight: '700',
    marginTop: 3,
  },
  trilho: {
    height: 6,
    borderRadius: 3,
    backgroundColor: '#ECEEF6',
    overflow: 'hidden',
    marginTop: 8,
  },
  trilhoPreenchido: {
    height: '100%',
    borderRadius: 3,
  },
  estadoVazio: {
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 18,
  },
  estadoVazioTitulo: {
    color: C.texto,
    fontSize: 14,
    fontWeight: '800',
    textAlign: 'center',
    marginTop: 12,
  },
  estadoVazioDescricao: {
    color: C.secundario,
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
    marginTop: 6,
  },
  botaoSecundario: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    alignSelf: 'flex-start',
    backgroundColor: C.azulClaro,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    marginTop: 14,
  },
  botaoSecundarioTexto: {
    color: C.azul,
    fontSize: 12,
    fontWeight: '800',
  },
  statusConexao: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
  },
  statusConexaoTexto: {
    color: C.secundario,
    fontSize: 12,
  },
  subsecao: {
    color: C.secundario,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
    marginTop: 9,
    marginBottom: 10,
  },
  gradeSensores: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 8,
  },
  cartaoSensor: {
    width: '31%',
    flexGrow: 1,
    backgroundColor: '#F8F9FD',
    borderRadius: 14,
    padding: 10,
    minHeight: 90,
  },
  sensorTitulo: {
    color: C.secundario,
    fontSize: 10,
    marginTop: 8,
  },
  sensorValor: {
    color: C.texto,
    fontSize: 14,
    fontWeight: '800',
    marginTop: 4,
  },
  somBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#F0EDFA',
    borderRadius: 14,
    padding: 14,
    marginTop: 15,
  },
  valorSom: {
    color: C.texto,
    fontSize: 20,
    fontWeight: '800',
    marginTop: 4,
  },
  aviso: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: C.azulClaro,
    borderRadius: 14,
    padding: 13,
  },
  avisoTexto: {
    flex: 1,
    color: C.texto,
    fontSize: 12,
    lineHeight: 19,
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
  navIconAtivo: {
    backgroundColor: C.azulClaro,
  },
  navTexto: {
    color: C.secundario,
    fontSize: 9,
    fontWeight: '600',
    textAlign: 'center',
  },
  navTextoAtivo: {
    color: C.texto,
    fontWeight: '800',
  },
});
