
import React, { useState } from 'react';
import {Alert,ScrollView,StyleSheet,Text,TouchableOpacity,View,} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { getDatabase } from '../database/database';

const C = {
  texto: '#30364D',
  secundario: '#65708F',
  azul: '#5574B8',
  azulClaro: '#E9EDFA',
  roxo: '#899EEB',
  verde: '#55B878',
  branco: '#FFFFFF',
};

const GRADIENTE = [
  '#899EEB',
  '#AAB9EF',
  '#C8CFED',
  '#E3E1D2',
  '#FFF5B8',
];

const ETAPAS = [
  {
    titulo: 'COMO ESTÁ SEU SONO?',
    subtitulo: 'Queremos entender melhor sua rotina de descanso.',
    icone: 'moon-outline',
    perguntas: [
      {
        campo: 'horas_sono',
        texto: 'Quantas horas você costuma dormir por noite?',
        opcoes: [
          'Menos de 5 horas',
          '5 a 6 horas',
          '6 a 7 horas',
          '7 a 8 horas',
          'Mais de 8 horas',
        ],
      },
      {
        campo: 'qualidade_sono',
        texto: 'Como você avalia a qualidade do seu sono?',
        opcoes: ['Muito ruim', 'Ruim', 'Regular', 'Boa', 'Muito boa'],
      },
      {
        campo: 'despertares',
        texto: 'Você costuma acordar durante a noite?',
        opcoes: [
          'Nunca',
          'Raramente',
          'Às vezes',
          'Frequentemente',
          'Todas as noites',
        ],
      },
      {
        campo: 'dificuldade_dormir',
        texto: 'Você tem dificuldade para pegar no sono?',
        opcoes: [
          'Nunca',
          'Raramente',
          'Às vezes',
          'Frequentemente',
        ],
      },
      {
        campo: 'descanso',
        texto: 'Quando acorda, você se sente descansado(a)?',
        opcoes: [
          'Nunca',
          'Raramente',
          'Às vezes',
          'Na maioria das vezes',
          'Sempre',
        ],
      },
    ],
  },
  {
    titulo: 'COMO É SUA ALIMENTAÇÃO?',
    subtitulo: 'Essas informações ajudam a acompanhar seus hábitos.',
    icone: 'restaurant-outline',
    perguntas: [
      {
        campo: 'refeicoes_dia',
        texto: 'Quantas refeições você costuma fazer por dia?',
        opcoes: ['1 a 2', '3', '4', '5 ou mais'],
      },
      {
        campo: 'frutas',
        texto: 'Com que frequência você come frutas?',
        opcoes: [
          'Nunca',
          'Raramente',
          'Algumas vezes por semana',
          'Todos os dias',
          'Mais de uma vez por dia',
        ],
      },
      {
        campo: 'verduras',
        texto: 'Com que frequência você come verduras e legumes?',
        opcoes: [
          'Nunca',
          'Raramente',
          'Algumas vezes por semana',
          'Todos os dias',
          'Mais de uma vez por dia',
        ],
      },
      {
        campo: 'ultraprocessados',
        texto: 'Com que frequência você consome alimentos ultraprocessados?',
        opcoes: [
          'Nunca',
          'Raramente',
          'Algumas vezes por semana',
          'Todos os dias',
          'Várias vezes ao dia',
        ],
      },
      {
        campo: 'agua',
        texto: 'Você costuma beber água ao longo do dia?',
        opcoes: [
          'Muito pouco',
          'Pouco',
          'Às vezes',
          'Frequentemente',
          'Regularmente',
        ],
      },
    ],
  },
  {
    titulo: 'COMO VOCÊ TEM SE SENTIDO?',
    subtitulo: 'Conte um pouco sobre seu bem-estar nas últimas semanas.',
    icone: 'heart-outline',
    perguntas: [
      {
        campo: 'humor',
        texto: 'Como você tem se sentido nas últimas duas semanas?',
        opcoes: ['Muito mal', 'Mal', 'Regular', 'Bem', 'Muito bem'],
      },
      {
        campo: 'estresse',
        texto: 'Com que frequência você se sentiu preocupado(a) ou tenso(a)?',
        opcoes: [
          'Nunca',
          'Raramente',
          'Às vezes',
          'Frequentemente',
          'Quase sempre',
        ],
      },
      {
        campo: 'relaxamento',
        texto: 'Com que frequência você teve dificuldade para relaxar?',
        opcoes: [
          'Nunca',
          'Raramente',
          'Às vezes',
          'Frequentemente',
          'Quase sempre',
        ],
      },
      {
        campo: 'disposicao',
        texto: 'Como está sua disposição no dia a dia?',
        opcoes: [
          'Muito baixa',
          'Baixa',
          'Regular',
          'Boa',
          'Muito boa',
        ],
      },
    ],
  },
  {
    titulo: 'SUA ROTINA',
    subtitulo: 'Agora vamos conhecer seus hábitos de atividade.',
    icone: 'walk-outline',
    perguntas: [
      {
        campo: 'atividade_minutos',
        texto:
          'Quanto tempo você costuma se movimentar ou fazer atividade física por dia?',
        opcoes: [
          'Quase não faço',
          'Até 15 minutos',
          '15 a 30 minutos',
          '30 a 60 minutos',
          'Mais de 1 hora',
        ],
      },
      {
        campo: 'atividade_frequencia',
        texto: 'Com que frequência você pratica atividade física?',
        opcoes: [
          'Nunca',
          '1 vez por semana',
          '2 a 3 vezes por semana',
          '4 a 5 vezes por semana',
          'Todos os dias',
        ],
      },
    ],
  },
  {
    titulo: 'SEU TIPO SANGUÍNEO',
    subtitulo:
      'Registre somente as informações sanguíneas que você conhece.',
    icone: 'water-outline',
    perguntas: [
      {
        campo: 'tipo_sanguineo',
        texto: 'Qual é o seu tipo sanguíneo?',
        tipoResposta: 'texto',
        opcoes: ['A', 'B', 'AB', 'O', 'Não sei'],
      },
      {
        campo: 'fator_rh',
        texto: 'Qual é o seu fator Rh?',
        tipoResposta: 'texto',
        opcoes: [
          'Positivo (+)',
          'Negativo (-)',
          'Não sei',
        ],
      },
      {
        campo: 'tipagem_confirmada',
        texto: 'Como você sabe seu tipo sanguíneo?',
        tipoResposta: 'texto',
        opcoes: [
          'Exame laboratorial',
          'Registro ou documento de saúde',
          'Informação de familiar',
          'Não tenho certeza',
        ],
      },
    ],
  },
  {
    titulo: 'SEU DIA A DIA',
    subtitulo: 'Por fim, queremos entender como está sua rotina.',
    icone: 'person-outline',
    perguntas: [
      {
        campo: 'dificuldade_atividades',
        texto:
          'Você sente dificuldade para realizar atividades do dia a dia?',
        opcoes: [
          'Nunca',
          'Raramente',
          'Às vezes',
          'Frequentemente',
          'Sempre',
        ],
      },
    ],
  },
];

// Gera automaticamente os campos de todas as etapas.
const CAMPOS = ETAPAS.flatMap(etapa =>
  etapa.perguntas.map(pergunta => pergunta.campo)
);

const VALORES_INICIAIS = Object.fromEntries(
  CAMPOS.map(campo => [campo, null])
);

// Adiciona as colunas novas sem apagar os dados existentes.
async function garantirColunasSanguineas(database) {
  const colunas = await database.getAllAsync(
    'PRAGMA table_info(questionarios);'
  );

  const colunasExistentes = new Set(
    colunas.map(coluna => coluna.name)
  );

  const novasColunas = [
    'tipo_sanguineo',
    'fator_rh',
    'tipagem_confirmada',
  ];

  for (const coluna of novasColunas) {
    if (!colunasExistentes.has(coluna)) {
      await database.runAsync(
        `ALTER TABLE questionarios ADD COLUMN ${coluna} TEXT;`
      );
    }
  }
}

// Navbar superior.
function NavbarSuperior({ insets }) {
  return (
    <View style={[styles.topSafeArea, { paddingTop: insets.top }]}>
      <View style={styles.navbar}>
        <TouchableOpacity
          style={styles.botaoPerfil}
          onPress={() => router.push('/config')}
          activeOpacity={0.8}
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
          onPress={() => router.push('/perfil')}
          activeOpacity={0.8}
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
  );
}

// Navbar inferior.
function NavbarInferior({ insets }) {
  const itens = [
    {
      texto: 'Início',
      icone: 'heart-outline',
      rota: '/batisono',
    },
    {
      texto: 'Questionário',
      icone: 'clipboard',
      ativo: true,
    },
    {
      texto: 'Conexão',
      icone: 'bluetooth-outline',
      rota: '/bluetooth',
    },
    {
      texto: 'Dicas',
      icone: 'book-outline',
      rota: '/dicas',
    },
  ];

  return (
    <View
      style={[
        styles.bottomSafeArea,
        { paddingBottom: Math.max(insets.bottom, 4) },
      ]}
    >
      <View style={styles.bottomBar}>
        {itens.map(item => (
          <TouchableOpacity
            key={item.texto}
            style={styles.navItem}
            activeOpacity={0.8}
            accessibilityLabel={item.texto}
            onPress={() => {
              if (item.rota) {
                router.replace(item.rota);
              }
            }}
          >
            <View
              style={[
                styles.navIcon,
                item.ativo && styles.navIconAtivo,
              ]}
            >
              <Ionicons
                name={item.icone}
                size={23}
                color={C.azul}
              />
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

// Uma pergunta e suas opções.
// As perguntas antigas continuam numéricas.
// As perguntas sanguíneas são armazenadas como texto.
function Pergunta({ pergunta, respostas, responder }) {
  return (
    <View style={styles.pergunta}>
      <Text style={styles.perguntaTexto}>
        {pergunta.texto}
      </Text>

      <View style={styles.opcoes}>
        {pergunta.opcoes.map((texto, index) => {
          const valor =
            pergunta.tipoResposta === 'texto'
              ? texto
              : index + 1;

          const selecionado =
            respostas[pergunta.campo] === valor;

          return (
            <TouchableOpacity
              key={`${pergunta.campo}-${texto}`}
              style={[
                styles.opcao,
                selecionado && styles.opcaoSelecionada,
              ]}
              activeOpacity={0.8}
              accessibilityRole="radio"
              accessibilityState={{ selected: selecionado }}
              onPress={() =>
                responder(pergunta.campo, valor)
              }
            >
              <View
                style={[
                  styles.radio,
                  selecionado && styles.radioSelecionado,
                ]}
              >
                {selecionado && (
                  <View style={styles.radioInterno} />
                )}
              </View>

              <Text
                style={[
                  styles.opcaoTexto,
                  selecionado && styles.opcaoTextoSelecionado,
                ]}
              >
                {texto}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

// Decorações de fundo.
function Decoracoes() {
  return (
    <View
      pointerEvents="none"
      style={StyleSheet.absoluteFill}
    >
      <View style={[styles.arc, styles.arcOne]} />
      <View style={[styles.arc, styles.arcTwo]} />
      <View style={[styles.arc, styles.arcThree]} />
      <View style={styles.glowOne} />
      <View style={styles.glowTwo} />
      <View style={styles.glowThree} />
    </View>
  );
}

export default function Questionario() {
  const insets = useSafeAreaInsets();
  const { usuarioId } = useLocalSearchParams();

  const [etapa, setEtapa] = useState(0);
  const [respostas, setRespostas] = useState(VALORES_INICIAIS);
  const [questionarioConcluido, setQuestionarioConcluido] =
    useState(false);
  const [salvando, setSalvando] = useState(false);

  const dadosEtapa = ETAPAS[etapa];

  const responder = (campo, valor) => {
    setRespostas(anterior => ({
      ...anterior,
      [campo]: valor,
    }));
  };

  const etapaCompleta = dadosEtapa.perguntas.every(
    pergunta => respostas[pergunta.campo] !== null
  );

  const finalizarQuestionario = async () => {
    if (!usuarioId || Array.isArray(usuarioId)) {
      Alert.alert(
        'Erro',
        'Não foi possível identificar o usuário. Entre novamente na sua conta.'
      );
      return;
    }

    const idNumerico = Number(usuarioId);

    if (!Number.isInteger(idNumerico) || idNumerico <= 0) {
      Alert.alert(
        'Erro',
        'O identificador do usuário é inválido.'
      );
      return;
    }

    if (salvando) {
      return;
    }

    setSalvando(true);

    try {
      const database = await getDatabase();

      // Garante que as novas colunas existam antes de salvar.
      await garantirColunasSanguineas(database);

      // São necessárias colunas e valores para usuario_id
      // e para cada um dos campos do questionário.
      const colunasInsert = ['usuario_id', ...CAMPOS];
      const placeholders = colunasInsert
        .map(() => '?')
        .join(', ');

      const valores = [
        idNumerico,
        ...CAMPOS.map(campo => respostas[campo]),
      ];

      await database.runAsync(
        `INSERT INTO questionarios (
          ${colunasInsert.join(', ')}
        ) VALUES (${placeholders});`,
        ...valores
      );

      await database.runAsync(
        `INSERT OR REPLACE INTO sessao
         (id, usuario_id, onboarding_concluido)
         VALUES (1, ?, 1);`,
        idNumerico
      );

      console.log(
        'Questionário salvo com sucesso:',
        {
          usuarioId: idNumerico,
          respostas,
        }
      );

      setQuestionarioConcluido(true);
    } catch (error) {
      console.error(
        'Erro ao salvar questionário:',
        error
      );

      Alert.alert(
        'Erro ao salvar',
        'Não foi possível salvar suas respostas. Verifique o banco de dados e tente novamente.'
      );
    } finally {
      setSalvando(false);
    }
  };

  const continuar = () => {
    if (!etapaCompleta) {
      Alert.alert(
        'Responda todas as perguntas',
        'Escolha uma opção antes de continuar.'
      );
      return;
    }

    if (etapa < ETAPAS.length - 1) {
      setEtapa(anterior => anterior + 1);
    } else {
      finalizarQuestionario();
    }
  };

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

      {questionarioConcluido ? (
        <View style={styles.conclusaoContainer}>
          <View style={styles.sucessoCirculo}>
            <Ionicons
              name="checkmark"
              size={58}
              color={C.branco}
            />
          </View>

          <Text style={styles.conclusaoTitulo}>
            TUDO PRONTO!
          </Text>

          <Text style={styles.conclusaoTexto}>
            Seu cadastro foi concluído com sucesso.
          </Text>

          <Text style={styles.conclusaoTextoSecundario}>
            Suas informações foram registradas e o Sunny
            Health está pronto para acompanhar sua rotina.
          </Text>

          <View style={styles.conclusaoCard}>
            <Ionicons
              name="shield-checkmark-outline"
              size={25}
              color={C.verde}
            />
            <Text style={styles.conclusaoCardTexto}>
              Seus dados foram salvos neste dispositivo.
            </Text>
          </View>

          <TouchableOpacity
            style={styles.botaoEntrar}
            activeOpacity={0.85}
            onPress={() => router.replace('/batisono')}
          >
            <Text style={styles.botaoEntrarTexto}>
              ENTRAR NO SUNNY HEALTH
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <SafeAreaView
            style={styles.safeArea}
            edges={['bottom']}
          >
            <View style={styles.content}>
              <View style={styles.iconeContainer}>
                <Ionicons
                  name={dadosEtapa.icone}
                  size={42}
                  color={C.branco}
                />
              </View>

              <Text style={styles.titulo}>
                {dadosEtapa.titulo}
              </Text>

              <Text style={styles.subtitulo}>
                {dadosEtapa.subtitulo}
              </Text>

              <View style={styles.progressoContainer}>
                {ETAPAS.map((item, index) => (
                  <View
                    key={item.titulo}
                    style={[
                      styles.progresso,
                      index <= etapa && styles.progressoAtivo,
                    ]}
                  />
                ))}
              </View>

              <View style={styles.perguntasCard}>
                <ScrollView
                  style={styles.scroll}
                  contentContainerStyle={styles.scrollContent}
                  showsVerticalScrollIndicator={false}
                  keyboardShouldPersistTaps="handled"
                >
                  {dadosEtapa.perguntas.map(pergunta => (
                    <Pergunta
                      key={pergunta.campo}
                      pergunta={pergunta}
                      respostas={respostas}
                      responder={responder}
                    />
                  ))}
                </ScrollView>
              </View>

              <TouchableOpacity
                style={[
                  styles.botao,
                  (!etapaCompleta || salvando) &&
                    styles.botaoDesativado,
                ]}
                activeOpacity={0.85}
                disabled={!etapaCompleta || salvando}
                onPress={continuar}
              >
                <Text style={styles.botaoTexto}>
                  {salvando
                    ? 'SALVANDO...'
                    : etapa === ETAPAS.length - 1
                      ? 'FINALIZAR'
                      : 'CONTINUAR'}
                </Text>
              </TouchableOpacity>
            </View>
          </SafeAreaView>

          <NavbarInferior insets={insets} />
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    overflow: 'hidden',
  },

  // Navbar superior
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

  // Área principal
  safeArea: {
    flex: 1,
  },

  content: {
    flex: 1,
    minHeight: 0,
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 8,
  },

  iconeContainer: {
    width: 65,
    height: 65,
    borderRadius: 33,
    backgroundColor: '#899EEB',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginTop: 2,
    marginBottom: 10,
  },

  titulo: {
    fontSize: 27,
    lineHeight: 32,
    fontWeight: '800',
    color: C.texto,
    textAlign: 'center',
  },

  subtitulo: {
    fontSize: 15.5,
    lineHeight: 21,
    color: '#4D5570',
    textAlign: 'center',
    marginTop: 5,
    marginBottom: 10,
  },

  progressoContainer: {
    flexDirection: 'row',
    width: '100%',
    gap: 6,
    marginBottom: 10,
  },

  progresso: {
    flex: 1,
    height: 5,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.55)',
  },

  progressoAtivo: {
    backgroundColor: C.branco,
  },

  // Cartão de perguntas
  perguntasCard: {
    flex: 1,
    minHeight: 0,
    backgroundColor: 'rgba(255,255,255,0.94)',
    borderRadius: 24,
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 5,
    shadowColor: C.texto,
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 5,
  },

  scroll: {
    flex: 1,
  },

  scrollContent: {
    paddingTop: 2,
    paddingBottom: 18,
  },

  pergunta: {
    marginBottom: 18,
  },

  perguntaTexto: {
    fontSize: 17,
    lineHeight: 23,
    fontWeight: '700',
    color: C.texto,
    marginBottom: 9,
  },

  opcoes: {
    gap: 7,
  },

  opcao: {
    minHeight: 50,
    borderRadius: 14,
    backgroundColor: '#F4F5FA',
    borderWidth: 2,
    borderColor: 'transparent',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 13,
  },

  opcaoSelecionada: {
    backgroundColor: '#EEF1FF',
    borderColor: C.roxo,
  },

  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: C.roxo,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 11,
  },

  radioSelecionado: {
    borderColor: C.roxo,
  },

  radioInterno: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: C.roxo,
  },

  opcaoTexto: {
    flex: 1,
    fontSize: 15,
    lineHeight: 19,
    color: C.texto,
  },

  opcaoTextoSelecionado: {
    fontWeight: '700',
  },

  // Botão de continuar
  botao: {
    height: 58,
    marginTop: 12,
    marginBottom: 4,
    borderRadius: 17,
    backgroundColor: C.verde,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: C.texto,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 7,
    elevation: 5,
  },

  botaoDesativado: {
    backgroundColor: '#AEB4C7',
  },

  botaoTexto: {
    color: C.branco,
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.5,
  },

  // Navbar inferior
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
    backgroundColor: '#E9EDFA',
  },

  navTexto: {
    color: '#65708F',
    fontSize: 9,
    fontWeight: '600',
    textAlign: 'center',
  },

  navTextoAtivo: {
    color: '#30364D',
    fontWeight: '800',
  },

  // Decorações do fundo
  arc: {
    position: 'absolute',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.20)',
    borderRadius: 300,
  },

  arcOne: {
    width: 480,
    height: 480,
    top: -210,
    right: -180,
    transform: [{ rotate: '18deg' }],
  },

  arcTwo: {
    width: 390,
    height: 390,
    top: 180,
    left: -230,
    borderColor: 'rgba(255,255,255,0.14)',
    transform: [{ rotate: '-20deg' }],
  },

  arcThree: {
    width: 600,
    height: 600,
    bottom: -350,
    right: -280,
    borderColor: 'rgba(255,255,255,0.17)',
    transform: [{ rotate: '12deg' }],
  },

  glowOne: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(255,255,255,0.08)',
    top: 70,
    right: -80,
  },

  glowTwo: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(255,245,184,0.12)',
    bottom: 180,
    left: -70,
  },

  glowThree: {
    position: 'absolute',
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: 'rgba(255,255,255,0.10)',
    top: 420,
    right: 20,
  },

  // Tela de conclusão
  conclusaoContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
    paddingBottom: 20,
  },

  sucessoCirculo: {
    width: 105,
    height: 105,
    borderRadius: 53,
    backgroundColor: C.verde,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: C.texto,
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.18,
    shadowRadius: 10,
    elevation: 6,
  },

  conclusaoTitulo: {
    fontSize: 30,
    fontWeight: '900',
    color: C.texto,
    marginTop: 25,
    textAlign: 'center',
  },

  conclusaoTexto: {
    fontSize: 18,
    fontWeight: '700',
    color: C.texto,
    textAlign: 'center',
    marginTop: 10,
  },

  conclusaoTextoSecundario: {
    fontSize: 15.5,
    lineHeight: 22,
    color: '#4D5570',
    textAlign: 'center',
    marginTop: 10,
    maxWidth: 340,
  },

  conclusaoCard: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderRadius: 18,
    paddingHorizontal: 18,
    paddingVertical: 16,
    marginTop: 25,
    gap: 12,
    shadowColor: C.texto,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },

  conclusaoCardTexto: {
    flex: 1,
    fontSize: 14.5,
    lineHeight: 20,
    color: '#4D5570',
    fontWeight: '600',
  },

  botaoEntrar: {
    width: '100%',
    height: 62,
    borderRadius: 18,
    backgroundColor: C.verde,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 25,
    shadowColor: C.texto,
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },

  botaoEntrarTexto: {
    color: C.branco,
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
});
