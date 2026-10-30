import {StyleSheet,Text,View,ScrollView,TouchableOpacity,Image,} from 'react-native';

import React, { useState } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

export default function Tremores() {
  const insets = useSafeAreaInsets();

  // ============================================================
  // DADOS DA PULSEIRA
  // ============================================================

  // Esses valores serão preenchidos futuramente pelo Bluetooth.
  const [intensidadeTremor] = useState(null);
  const [episodiosTremor] = useState(null);
  const [freezing] = useState(null);
  const [bradicinesia] = useState(null);
  const [estabilidadeTremor] = useState(null);

  // ============================================================
  // NAVEGAÇÃO
  // ============================================================

  const navegar = (rota) => {
    router.push(rota);
  };

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <View style={styles.safeArea}>
      <View style={styles.container}>

        {/* ======================================================
            FUNDO
        ====================================================== */}

        <View
          style={[
            StyleSheet.absoluteFill,
            {
              backgroundColor: '#C9C3E6',
            },
          ]}
        />

        {/* ======================================================
            BRILHOS
        ====================================================== */}

        <View
          pointerEvents="none"
          style={styles.glowOne}
        />

        <View
          pointerEvents="none"
          style={styles.glowTwo}
        />

        <View
          pointerEvents="none"
          style={styles.glowThree}
        />

        {/* ======================================================
            NAVBAR
        ====================================================== */}

        <View
          style={[
            styles.topSafeArea,
            {
              paddingTop: insets.top,
            },
          ]}
        >
          <View style={styles.navbar}>

            <View style={styles.navbarTexto}>
              <Text style={styles.nomeLogo}>
                SUNNY HEALTH
              </Text>

              <Image
                source={require('../assets/images/Logo.png')}
                style={styles.logoImagem}
                resizeMode="contain"
              />
            </View>

            <TouchableOpacity
              style={styles.botaoPerfil}
              onPress={() => navegar('/perfil')}
              activeOpacity={0.8}
            >
              <Ionicons
                name="person-outline"
                size={26}
                color="#30364D"
              />
            </TouchableOpacity>

          </View>
        </View>

        {/* ======================================================
            CONTEÚDO
        ====================================================== */}

        <View style={styles.conteudoPrincipal}>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >

            {/* ==================================================
                TÍTULO
            ================================================== */}

            <View style={styles.tituloPagina}>

              <Text style={styles.titulo}>
                Tremores
              </Text>

              <Text style={styles.subtituloPagina}>
                Acompanhe os dados registrados pela pulseira.
              </Text>

            </View>

            {/* ==================================================
                RESUMO DO TREMOR
            ================================================== */}

            <View style={styles.card}>

              <View style={styles.cardCabecalho}>

                <View
                  style={[
                    styles.iconeCard,
                    styles.iconeTremor,
                  ]}
                >
                  <Ionicons
                    name="hand-left"
                    size={29}
                    color="#5574B8"
                  />
                </View>

                <View style={styles.cardTituloArea}>

                  <Text style={styles.cardTitulo}>
                    Monitoramento dos tremores
                  </Text>

                  <Text style={styles.cardDescricao}>
                    Dados registrados pela pulseira
                  </Text>

                </View>

              </View>

              {/* ==================================================
                  INTENSIDADE
              ================================================== */}

              <View style={styles.intensidadeBox}>

                <View style={styles.intensidadeTexto}>

                  <Text style={styles.label}>
                    Intensidade do tremor
                  </Text>

                  <View style={styles.linhaValor}>

                    <Text style={styles.valorGrande}>
                      {intensidadeTremor ?? '--'}
                    </Text>

                    <Text style={styles.unidade}>
                      %
                    </Text>

                  </View>

                  <Text style={styles.textoAguardando}>
                    Aguardando dados da pulseira
                  </Text>

                </View>

                <View style={styles.iconeIntensidade}>

                  <Ionicons
                    name="pulse-outline"
                    size={31}
                    color="#5574B8"
                  />

                </View>

              </View>

              {/* ==================================================
                  INDICADORES
              ================================================== */}

              <View style={styles.linhaIndicadores}>

                {/* EPISÓDIOS */}

                <View style={styles.indicador}>

                  <Ionicons
                    name="analytics-outline"
                    size={24}
                    color="#5574B8"
                  />

                  <Text style={styles.indicadorValor}>
                    {episodiosTremor ?? '--'}
                  </Text>

                  <Text style={styles.indicadorTexto}>
                    episódios
                  </Text>

                </View>

                <View style={styles.linhaVertical} />

                {/* FREEZING */}

                <View style={styles.indicador}>

                  <Ionicons
                    name="pause-circle-outline"
                    size={24}
                    color="#5574B8"
                  />

                  <Text style={styles.indicadorValor}>
                    {freezing ?? '--'}
                  </Text>

                  <Text style={styles.indicadorTexto}>
                    freezing
                  </Text>

                </View>

                <View style={styles.linhaVertical} />

                {/* BRADICINESIA */}

                <View style={styles.indicador}>

                  <Ionicons
                    name="walk-outline"
                    size={24}
                    color="#5574B8"
                  />

                  <Text style={styles.indicadorValor}>
                    {bradicinesia ?? '--'}
                  </Text>

                  <Text style={styles.indicadorTexto}>
                    bradicinesia
                  </Text>

                </View>

              </View>

              {/* ==================================================
                  AVISO BLUETOOTH
              ================================================== */}

              <View style={styles.avisoBluetooth}>

                <Ionicons
                  name="bluetooth-outline"
                  size={20}
                  color="#5574B8"
                />

                <Text style={styles.textoAviso}>
                  Esses dados serão preenchidos quando a
                  pulseira estiver conectada ao aplicativo.
                </Text>

              </View>

            </View>

            {/* ==================================================
                ESTABILIDADE DO TREMOR
            ================================================== */}

            <View style={styles.card}>

              <View style={styles.graficoCabecalho}>

                <View style={styles.cardTituloArea}>

                  <Text style={styles.cardTitulo}>
                    Estabilidade do tremor
                  </Text>

                  <Text style={styles.cardDescricao}>
                    Análise dos movimentos registrados
                  </Text>

                </View>

                <View
                  style={[
                    styles.iconeCard,
                    styles.iconeEstabilidade,
                  ]}
                >

                  <Ionicons
                    name="pulse-outline"
                    size={27}
                    color="#536A9E"
                  />

                </View>

              </View>

              {/* ==================================================
                  INDICADOR DE ESTABILIDADE
              ================================================== */}

              <View style={styles.estabilidadeContainer}>

                <View style={styles.circuloEstabilidade}>

                  <Text style={styles.valorEstabilidade}>
                    {estabilidadeTremor ?? '--'}
                  </Text>

                  <Text style={styles.porcentagem}>
                    %
                  </Text>

                </View>

                <View style={styles.estabilidadeTexto}>

                  <Text style={styles.estabilidadeTitulo}>
                    Estabilidade
                  </Text>

                  <Text style={styles.estabilidadeDescricao}>
                    O indicador será calculado a partir
                    dos movimentos registrados pela pulseira.
                  </Text>

                </View>

              </View>

              <View style={styles.linhaEstabilidade} />

              <View style={styles.estabilidadeInfo}>

                <Ionicons
                  name="information-circle-outline"
                  size={21}
                  color="#5574B8"
                />

                <Text style={styles.estabilidadeInfoTexto}>
                  Quanto mais dados forem registrados,
                  mais informações estarão disponíveis
                  para acompanhamento.
                </Text>

              </View>

            </View>

            {/* ==================================================
                HISTÓRICO
            ================================================== */}

            <View style={styles.card}>

              <View style={styles.graficoCabecalho}>

                <View style={styles.cardTituloArea}>

                  <Text style={styles.cardTitulo}>
                    Histórico dos tremores
                  </Text>

                  <Text style={styles.cardDescricao}>
                    Registros ao longo do tempo
                  </Text>

                </View>

                <View
                  style={[
                    styles.iconeCard,
                    styles.iconeHistorico,
                  ]}
                >

                  <Ionicons
                    name="bar-chart-outline"
                    size={27}
                    color="#5574B8"
                  />

                </View>

              </View>

              {/* ==================================================
                  GRÁFICO VAZIO
              ================================================== */}

              <View style={styles.graficoVazio}>

                <Ionicons
                  name="analytics-outline"
                  size={42}
                  color="#C8D4EA"
                />

                <Text style={styles.textoGraficoVazio}>
                  Aguardando dados da pulseira
                </Text>

                <Text style={styles.subtextoGraficoVazio}>
                  O histórico será preenchido conforme
                  os tremores forem registrados.
                </Text>

              </View>

            </View>

            {/* ==================================================
                SOBRE OS DADOS
            ================================================== */}

            <View style={styles.cardAviso}>

              <View style={styles.iconeAviso}>

                <Ionicons
                  name="information-circle-outline"
                  size={25}
                  color="#5574B8"
                />

              </View>

              <View style={styles.textoAvisoArea}>

                <Text style={styles.tituloAviso}>
                  Sobre os dados
                </Text>

                <Text style={styles.textoAvisoCompleto}>
                  As informações sobre os tremores serão
                  obtidas a partir dos sensores da pulseira,
                  permitindo acompanhar a intensidade e
                  a ocorrência dos episódios ao longo do tempo.
                </Text>

              </View>

            </View>

            <View style={{ height: 25 }} />

          </ScrollView>

        </View>

        {/* ======================================================
            BARRA INFERIOR
        ====================================================== */}

        <View
          style={[
            styles.bottomSafeArea,
            {
              paddingBottom: insets.bottom,
            },
          ]}
        >

          <View style={styles.bottomBar}>

            {/* ==================================================
                INÍCIO
            ================================================== */}

            <TouchableOpacity
              style={styles.navItem}
              onPress={() => navegar('/inicio')}
              activeOpacity={0.8}
            >

              <View style={styles.navIcon}>

                <Ionicons
                  name="home-outline"
                  size={25}
                  color="#5574B8"
                />

              </View>

              <Text style={styles.navTexto}>
                Início
              </Text>

            </TouchableOpacity>

            {/* ==================================================
                BATIMENTOS
            ================================================== */}

            <TouchableOpacity
              style={styles.navItem}
              onPress={() => navegar('/batisono')}
              activeOpacity={0.8}
            >

              <View style={styles.navIcon}>

                <Ionicons
                  name="heart-outline"
                  size={25}
                  color="#5574B8"
                />

              </View>

              <Text style={styles.navTexto}>
                Batimentos
              </Text>

            </TouchableOpacity>

            {/* ==================================================
                TREMores - ATIVO
            ================================================== */}

            <TouchableOpacity
              style={styles.navItem}
              onPress={() => navegar('/tremores')}
              activeOpacity={0.8}
            >

              <View style={styles.navIconAtivo}>

                <Ionicons
                  name="hand-left"
                  size={25}
                  color="#30364D"
                />

              </View>

              <Text
                style={[
                  styles.navTexto,
                  styles.navTextoAtivo,
                ]}
              >
                Tremores
              </Text>

            </TouchableOpacity>

            {/* ==================================================
                SAÚDE
            ================================================== */}

            <TouchableOpacity
              style={styles.navItem}
              onPress={() => navegar('/saude')}
              activeOpacity={0.8}
            >

              <View style={styles.navIcon}>

                <Ionicons
                  name="shield-checkmark-outline"
                  size={25}
                  color="#5574B8"
                />

              </View>

              <Text style={styles.navTexto}>
                Saúde
              </Text>

            </TouchableOpacity>

            {/* ==================================================
                QUESTIONÁRIO
            ================================================== */}

            <TouchableOpacity
              style={styles.navItem}
              onPress={() => navegar('/quest')}
              activeOpacity={0.8}
            >

              <View style={styles.navIcon}>

                <Ionicons
                  name="document-text-outline"
                  size={25}
                  color="#5574B8"
                />

              </View>

              <Text style={styles.navTexto}>
                Questionário
              </Text>

            </TouchableOpacity>

          </View>

        </View>

      </View>
    </View>
  );
}

const styles = StyleSheet.create({

  // ============================================================
  // ESTRUTURA
  // ============================================================

  safeArea: {
    flex: 1,
    backgroundColor: '#C9C3E6',
  },

  container: {
    flex: 1,
    overflow: 'hidden',
  },

  conteudoPrincipal: {
    flex: 1,
  },

  // ============================================================
  // BRILHOS
  // ============================================================

  glowOne: {
    position: 'absolute',
    width: 190,
    height: 190,
    borderRadius: 100,
    backgroundColor: 'rgba(255,255,255,0.08)',
    top: 100,
    right: -90,
  },

  glowTwo: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 100,
    backgroundColor: 'rgba(255,255,255,0.10)',
    bottom: 150,
    left: -80,
  },

  glowThree: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 100,
    backgroundColor: 'rgba(255,255,255,0.08)',
    top: 420,
    right: 20,
  },

  // ============================================================
  // NAVBAR
  // ============================================================

  topSafeArea: {
    backgroundColor: 'transparent',
    zIndex: 20,
  },

  navbar: {
    minHeight: 76,
    paddingHorizontal: 20,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#DDE3F0',
    shadowColor: '#30364D',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.07,
    shadowRadius: 5,
    elevation: 4,
  },

  navbarTexto: {
    flex: 1,
    marginRight: 12,
  },

  nomeLogo: {
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 1.2,
    color: '#416AAB',
    marginTop: 15,
    marginBottom: -42,
    marginLeft: 45,
  },

  logoImagem: {
    width: 200,
    height: 65,
    marginLeft: -85,
  },

  botaoPerfil: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#E2E9F7',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#C8D4EA',
  },

  // ============================================================
  // SCROLL
  // ============================================================

  scrollContent: {
    paddingHorizontal: 18,
    paddingTop: 17,
    paddingBottom: 22,
  },

  // ============================================================
  // TÍTULO
  // ============================================================

  tituloPagina: {
    marginBottom: 18,
  },

  titulo: {
    fontSize: 29,
    fontWeight: '800',
    color: '#30364D',
  },

  subtituloPagina: {
    marginTop: 5,
    fontSize: 16,
    color: '#4B5268',
  },

  // ============================================================
  // CARDS
  // ============================================================

  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 21,
    padding: 18,
    marginBottom: 15,
    shadowColor: '#30364D',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.10,
    shadowRadius: 10,
    elevation: 4,
  },

  cardCabecalho: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  cardTituloArea: {
    flex: 1,
  },

  iconeCard: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },

  iconeTremor: {
    backgroundColor: '#E2E9F7',
  },

  iconeEstabilidade: {
    backgroundColor: '#E8EAF7',
  },

  iconeHistorico: {
    backgroundColor: '#E2E9F7',
  },

  cardTitulo: {
    fontSize: 18,
    fontWeight: '700',
    color: '#30364D',
  },

  cardDescricao: {
    marginTop: 5,
    fontSize: 13,
    color: '#7183A8',
  },

  // ============================================================
  // INTENSIDADE DO TREMOR
  // ============================================================

  intensidadeBox: {
    marginTop: 17,
    padding: 16,
    borderRadius: 17,
    backgroundColor: '#F7F8FC',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  intensidadeTexto: {
    flex: 1,
  },

  label: {
    fontSize: 12,
    color: '#7183A8',
    fontWeight: '600',
  },

  linhaValor: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: 2,
  },

  valorGrande: {
    fontSize: 32,
    fontWeight: '800',
    color: '#416AAB',
  },

  unidade: {
    fontSize: 13,
    fontWeight: '600',
    color: '#62749C',
    marginLeft: 4,
  },

  textoAguardando: {
    marginTop: 3,
    fontSize: 10,
    color: '#9BAFE5',
  },

  iconeIntensidade: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#E2E9F7',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 10,
  },

  // ============================================================
  // INDICADORES
  // ============================================================

  linhaIndicadores: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    marginTop: 15,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#E1E6F0',
  },

  indicador: {
    flex: 1,
    alignItems: 'center',
  },

  indicadorValor: {
    marginTop: 5,
    fontSize: 23,
    fontWeight: '800',
    color: '#30364D',
  },

  indicadorTexto: {
    marginTop: 2,
    fontSize: 11,
    color: '#7183A8',
    textAlign: 'center',
  },

  linhaVertical: {
    width: 1,
    height: 42,
    backgroundColor: '#DCE2EE',
  },

  // ============================================================
  // AVISO BLUETOOTH
  // ============================================================

  avisoBluetooth: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8EDF8',
    borderRadius: 14,
    padding: 11,
    marginTop: 15,
  },

  textoAviso: {
    flex: 1,
    marginLeft: 8,
    fontSize: 10,
    lineHeight: 15,
    color: '#62749C',
  },

  // ============================================================
  // ESTABILIDADE
  // ============================================================

  estabilidadeContainer: {
    marginTop: 17,
    padding: 17,
    borderRadius: 17,
    backgroundColor: '#F7F8FC',
    flexDirection: 'row',
    alignItems: 'center',
  },

  circuloEstabilidade: {
    width: 105,
    height: 105,
    borderRadius: 53,
    backgroundColor: '#E2E9F7',
    borderWidth: 7,
    borderColor: '#C8D4EA',
    alignItems: 'center',
    justifyContent: 'center',
  },

  valorEstabilidade: {
    fontSize: 28,
    fontWeight: '800',
    color: '#416AAB',
  },

  porcentagem: {
    marginTop: -3,
    fontSize: 12,
    fontWeight: '700',
    color: '#7183A8',
  },

  estabilidadeTexto: {
    flex: 1,
    marginLeft: 17,
  },

  estabilidadeTitulo: {
    fontSize: 16,
    fontWeight: '700',
    color: '#30364D',
  },

  estabilidadeDescricao: {
    marginTop: 6,
    fontSize: 11,
    lineHeight: 16,
    color: '#7183A8',
  },

  linhaEstabilidade: {
    height: 1,
    backgroundColor: '#E1E6F0',
    marginTop: 16,
  },

  estabilidadeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 13,
  },

  estabilidadeInfoTexto: {
    flex: 1,
    marginLeft: 8,
    fontSize: 10,
    lineHeight: 15,
    color: '#62749C',
  },

  // ============================================================
  // GRÁFICO
  // ============================================================

  graficoCabecalho: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  graficoVazio: {
    height: 180,
    marginTop: 15,
    borderRadius: 17,
    backgroundColor: '#F7F8FC',
    borderWidth: 1,
    borderColor: '#E1E6F0',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 30,
  },

  textoGraficoVazio: {
    marginTop: 9,
    fontSize: 13,
    fontWeight: '700',
    color: '#62749C',
    textAlign: 'center',
  },

  subtextoGraficoVazio: {
    marginTop: 5,
    fontSize: 10,
    lineHeight: 15,
    color: '#9BAFE5',
    textAlign: 'center',
  },

  // ============================================================
  // AVISO FINAL
  // ============================================================

  cardAviso: {
    backgroundColor: '#FFFFFF',
    borderRadius: 21,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    shadowColor: '#30364D',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },

  iconeAviso: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#E2E9F7',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 11,
  },

  textoAvisoArea: {
    flex: 1,
  },

  tituloAviso: {
    fontSize: 13,
    fontWeight: '700',
    color: '#30364D',
  },

  textoAvisoCompleto: {
    marginTop: 4,
    fontSize: 10,
    lineHeight: 15,
    color: '#7183A8',
  },

  // ============================================================
  // BARRA INFERIOR
  // ============================================================

  bottomSafeArea: {
    backgroundColor: '#FFFFFF',
    zIndex: 20,
  },

  bottomBar: {
    height: 76,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#DDE3F0',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 4,
    paddingTop: 5,
    paddingBottom: 5,
    shadowColor: '#30364D',
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.07,
    shadowRadius: 5,
    elevation: 8,
  },

  navItem: {
    flex: 1,
    height: 66,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 3,
  },

  navIcon: {
    width: 42,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },

  navIconAtivo: {
    width: 43,
    height: 36,
    borderRadius: 22,
    backgroundColor: '#E2E9F7',
    alignItems: 'center',
    justifyContent: 'center',
  },

  navTexto: {
    marginTop: 3,
    fontSize: 10,
    fontWeight: '600',
    color: '#7183A8',
    textAlign: 'center',
  },

  navTextoAtivo: {
    color: '#30364D',
    fontWeight: '700',
  },

});