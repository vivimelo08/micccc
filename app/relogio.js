import {StyleSheet,Text,View,TouchableOpacity,Animated,Easing,ScrollView,useWindowDimensions,} from 'react-native';
import React, { useEffect, useRef, useState } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function Relogio() {
  // ============================================================
  // USUÁRIO
  // ============================================================

  const { usuarioId } = useLocalSearchParams();

  // ============================================================
  // DIMENSÕES DO CELULAR
  // ============================================================

  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  const isSmallScreen = width < 360;
  const isShortScreen = height < 700;

  const horizontalPadding = isSmallScreen ? 18 : 25;

  // ============================================================
  // BLUETOOTH
  // ============================================================

  const [status, setStatus] = useState('idle');

  const pulse = useRef(new Animated.Value(1)).current;
  const scale = useRef(new Animated.Value(1)).current;

  // ============================================================
  // ONDAS
  // ============================================================

  const arc1 = useRef(new Animated.Value(0)).current;
  const arc2 = useRef(new Animated.Value(0)).current;
  const arc3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animateArc = (
      animation,
      delay,
      duration = 6500
    ) => {
      return Animated.loop(
        Animated.sequence([
          Animated.delay(delay),

          Animated.timing(animation, {
            toValue: 1,
            duration,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),

          Animated.timing(animation, {
            toValue: 0,
            duration,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      );
    };

    const animation1 = animateArc(arc1, 0);
    const animation2 = animateArc(arc2, 1200);
    const animation3 = animateArc(arc3, 2400);

    animation1.start();
    animation2.start();
    animation3.start();

    return () => {
      animation1.stop();
      animation2.stop();
      animation3.stop();
    };
  }, []);

  const moveArc1 = arc1.interpolate({
    inputRange: [0, 1],
    outputRange: [-20, 25],
  });

  const moveArc2 = arc2.interpolate({
    inputRange: [0, 1],
    outputRange: [25, -30],
  });

  const moveArc3 = arc3.interpolate({
    inputRange: [0, 1],
    outputRange: [-15, 35],
  });

  // ============================================================
  // ANIMAÇÃO DA PULSEIRA
  // ============================================================

  const iniciarAnimacao = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1.08,
          duration: 700,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),

        Animated.timing(pulse, {
          toValue: 1,
          duration: 700,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  const pararAnimacao = () => {
    pulse.stopAnimation();

    Animated.spring(pulse, {
      toValue: 1,
      friction: 5,
      tension: 100,
      useNativeDriver: true,
    }).start();
  };

  // ============================================================
  // CONECTAR PULSEIRA
  // ============================================================

  const conectarPulseira = () => {
    if (
      status === 'connecting' ||
      status === 'connected'
    ) {
      return;
    }

    // Mostra que está conectando
    setStatus('connecting');

    // Inicia animação da pulseira
    iniciarAnimacao();

    // Simulação da conexão Bluetooth
    setTimeout(() => {
      pararAnimacao();

      // Simula que a pulseira foi conectada
      setStatus('connected');

      // Pequena animação no botão CONTINUAR
      Animated.sequence([
        Animated.spring(scale, {
          toValue: 1.05,
          friction: 4,
          tension: 100,
          useNativeDriver: true,
        }),

        Animated.spring(scale, {
          toValue: 1,
          friction: 5,
          tension: 100,
          useNativeDriver: true,
        }),
      ]).start();
    }, 1500);
  };

  // ============================================================
  // CONTINUAR
  // ============================================================

  const continuar = () => {
    router.replace({
      pathname: '/questionario',
      params: {
        usuarioId: String(usuarioId),
      },
    });
  };

  // ============================================================
  // TAMANHO RESPONSIVO DA PULSEIRA
  // ============================================================

  const watchSize = isSmallScreen ? 130 : 150;
  const watchRadius = watchSize / 2;

  const iconSize = isSmallScreen ? 76 : 90;

  // ============================================================
  // TELA
  // ============================================================

  return (
    <View style={styles.container}>

      {/* ======================================================
          FUNDO
          ====================================================== */}

      <LinearGradient
        colors={[
          '#899EEB',
          '#AAB9EF',
          '#C8CFED',
          '#E3E1D2',
          '#FFF5B8',
        ]}
        locations={[
          0,
          0.25,
          0.52,
          0.78,
          1,
        ]}
        start={{
          x: 0,
          y: 0,
        }}
        end={{
          x: 1,
          y: 1,
        }}
        style={StyleSheet.absoluteFill}
      />

      {/* ======================================================
          ONDAS
          ====================================================== */}

      <Animated.View
        pointerEvents="none"
        style={[
          styles.arc,
          styles.arcOne,
          {
            transform: [
              {
                translateX: moveArc1,
              },
            ],
          },
        ]}
      />

      <Animated.View
        pointerEvents="none"
        style={[
          styles.arc,
          styles.arcTwo,
          {
            transform: [
              {
                translateX: moveArc2,
              },
            ],
          },
        ]}
      />

      <Animated.View
        pointerEvents="none"
        style={[
          styles.arc,
          styles.arcThree,
          {
            transform: [
              {
                translateX: moveArc3,
              },
            ],
          },
        ]}
      />

      {/* ======================================================
          CONTEÚDO ROLÁVEL
          ====================================================== */}

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: Math.max(insets.top + 20, 35),
            paddingBottom: Math.max(insets.bottom + 30, 40),
            paddingHorizontal: horizontalPadding,
          },
        ]}
        showsVerticalScrollIndicator={false}
        bounces={true}
        keyboardShouldPersistTaps="handled"
      >

        <View style={styles.content}>

          {/* ====================================================
              TÍTULO
              ==================================================== */}

          <Text
            style={[
              styles.title,
              isSmallScreen && styles.titleSmall,
            ]}
          >
            VAMOS CONECTAR
          </Text>

          <Text
            style={[
              styles.title,
              isSmallScreen && styles.titleSmall,
            ]}
          >
            SUA PULSEIRA
          </Text>

          {/* ====================================================
              ÍCONE DA PULSEIRA
              ==================================================== */}

          <Animated.View
            style={[
              styles.watchContainer,
              {
                marginTop: isShortScreen ? 18 : 25,
                marginBottom: isShortScreen ? 16 : 20,

                transform: [
                  {
                    scale: pulse,
                  },
                ],
              },
            ]}
          >

            <View
              style={[
                styles.watchCircle,
                {
                  width: watchSize,
                  height: watchSize,
                  borderRadius: watchRadius,
                },

                status === 'connected' &&
                  styles.watchCircleConnected,
              ]}
            >

              <Ionicons
                name="watch-outline"
                size={iconSize}
                color={
                  status === 'connected'
                    ? '#FFFFFF'
                    : '#30364D'
                }
              />

            </View>

            {/* ÍCONE DE CONFIRMAÇÃO */}

            {status === 'connected' && (
              <View style={styles.checkCircle}>
                <Ionicons
                  name="checkmark"
                  size={28}
                  color="#FFFFFF"
                />
              </View>
            )}

          </Animated.View>

          {/* ====================================================
              INSTRUÇÃO
              ==================================================== */}

          <Text
            style={[
              styles.instruction,
              isSmallScreen &&
                styles.instructionSmall,
            ]}
          >

            {status === 'idle' &&
              'Agora vamos conectar sua pulseira ao Sunny Health.'}

            {status === 'connecting' &&
              'Conectando sua pulseira ao Sunny Health...'}

            {status === 'connected' &&
              'Tudo certo! Sua pulseira está conectada.'}

          </Text>

          {/* ====================================================
              PASSOS
              ==================================================== */}

          {status !== 'connected' && (
            <View style={styles.stepsContainer}>

              <View style={styles.step}>

                <View style={styles.numberCircle}>
                  <Text style={styles.number}>
                    1
                  </Text>
                </View>

                <Text style={styles.stepText}>
                  Deixe a pulseira perto do seu celular.
                </Text>

              </View>

              <View style={styles.step}>

                <View style={styles.numberCircle}>
                  <Text style={styles.number}>
                    2
                  </Text>
                </View>

                <Text style={styles.stepText}>
                  Toque em "Conectar pulseira".
                </Text>

              </View>

              <View
                style={[
                  styles.step,
                  {
                    marginBottom: 0,
                  },
                ]}
              >

                <View style={styles.numberCircle}>
                  <Text style={styles.number}>
                    3
                  </Text>
                </View>

                <Text style={styles.stepText}>
                  Aguarde a configuração da conexão.
                </Text>

              </View>

            </View>
          )}

          {/* ====================================================
              STATUS
              ==================================================== */}

          <View
            style={[
              styles.statusContainer,
              status === 'connected' &&
                styles.statusContainerConnected,
            ]}
          >

            <View
              style={[
                styles.statusDot,

                status === 'connecting' &&
                  styles.statusDotConnecting,

                status === 'connected' &&
                  styles.statusDotConnected,
              ]}
            />

            <Text style={styles.statusText}>

              {status === 'idle' &&
                'Bluetooth ainda não configurado'}

              {status === 'connecting' &&
                'Conectando...'}

              {status === 'connected' &&
                'Pulseira conectada'}

            </Text>

          </View>

          {/* ====================================================
              BOTÕES
              ==================================================== */}

          {status !== 'connected' ? (

            <View style={styles.buttonsContainer}>

              {/* BOTÃO CONECTAR */}

              <TouchableOpacity
                style={[
                  styles.connectButton,

                  status === 'connecting' &&
                    styles.connectButtonConnecting,
                ]}
                activeOpacity={0.85}
                onPress={conectarPulseira}
                disabled={status === 'connecting'}
              >

                <Ionicons
                  name={
                    status === 'connecting'
                      ? 'bluetooth'
                      : 'bluetooth-outline'
                  }
                  size={27}
                  color="#FFFFFF"
                />

                <Text
                  style={[
                    styles.connectButtonText,
                    isSmallScreen &&
                      styles.buttonTextSmall,
                  ]}
                >

                  {status === 'connecting'
                    ? 'CONECTANDO...'
                    : 'CONECTAR PULSEIRA'}

                </Text>

              </TouchableOpacity>

            </View>

          ) : (

            /* ==================================================
               BOTÃO CONTINUAR
               ================================================== */

            <Animated.View
              style={[
                styles.continueWrapper,
                {
                  transform: [
                    {
                      scale,
                    },
                  ],
                },
              ]}
            >

              <TouchableOpacity
                style={styles.continueButton}
                activeOpacity={0.85}
                onPress={continuar}
              >

                <Text
                  style={[
                    styles.continueButtonText,
                    isSmallScreen &&
                      styles.buttonTextSmall,
                  ]}
                >
                  CONTINUAR
                </Text>

              </TouchableOpacity>

            </Animated.View>

          )}

        </View>

      </ScrollView>

    </View>
  );
}

// ============================================================
// ESTILOS
// ============================================================

const styles = StyleSheet.create({

  // ==========================================================
  // CONTAINER
  // ==========================================================

  container: {
    flex: 1,
    overflow: 'hidden',
  },

  scroll: {
    flex: 1,
  },

  scrollContent: {
    flexGrow: 1,
  },

  content: {
    width: '100%',
    maxWidth: 520,
    alignSelf: 'center',
    alignItems: 'center',
  },

  // ==========================================================
  // ONDAS
  // ==========================================================

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
  },

  arcTwo: {
    width: 390,
    height: 390,
    top: 180,
    left: -230,
    borderColor: 'rgba(255,255,255,0.14)',
  },

  arcThree: {
    width: 600,
    height: 600,
    bottom: -350,
    right: -280,
    borderColor: 'rgba(255,255,255,0.17)',
  },

  // ==========================================================
  // TÍTULO
  // ==========================================================

  title: {
    fontSize: 34,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
    letterSpacing: 0.5,
    lineHeight: 42,
  },

  titleSmall: {
    fontSize: 29,
    lineHeight: 36,
  },

  // ==========================================================
  // PULSEIRA
  // ==========================================================

  watchContainer: {
    position: 'relative',
  },

  watchCircle: {
    backgroundColor: 'rgba(255,255,255,0.82)',
    justifyContent: 'center',
    alignItems: 'center',

    shadowColor: '#30364D',
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },

  watchCircleConnected: {
    backgroundColor: '#55B878',
  },

  checkCircle: {
    position: 'absolute',
    right: -5,
    bottom: 0,

    width: 48,
    height: 48,
    borderRadius: 24,

    backgroundColor: '#55B878',

    justifyContent: 'center',
    alignItems: 'center',

    borderWidth: 4,
    borderColor: '#FFFFFF',
  },

  // ==========================================================
  // INSTRUÇÃO
  // ==========================================================

  instruction: {
    width: '100%',
    maxWidth: 400,

    fontSize: 19,
    lineHeight: 27,

    color: '#30364D',
    textAlign: 'center',
    fontWeight: '500',

    marginBottom: 20,
  },

  instructionSmall: {
    fontSize: 17,
    lineHeight: 24,
  },

  // ==========================================================
  // PASSOS
  // ==========================================================

  stepsContainer: {
    width: '100%',

    backgroundColor: 'rgba(255,255,255,0.70)',

    borderRadius: 18,

    padding: 17,

    marginBottom: 17,
  },

  step: {
    width: '100%',

    flexDirection: 'row',
    alignItems: 'center',

    marginBottom: 12,
  },

  numberCircle: {
    width: 34,
    height: 34,

    flexShrink: 0,

    borderRadius: 17,

    backgroundColor: '#899EEB',

    justifyContent: 'center',
    alignItems: 'center',

    marginRight: 12,
  },

  number: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '800',
  },

  stepText: {
    flex: 1,

    color: '#30364D',

    fontSize: 16,
    lineHeight: 21,
  },

  // ==========================================================
  // STATUS
  // ==========================================================

  statusContainer: {
    width: '100%',

    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',

    marginBottom: 17,

    paddingHorizontal: 8,
  },

  statusContainerConnected: {
    marginTop: 5,
  },

  statusDot: {
    width: 13,
    height: 13,

    flexShrink: 0,

    borderRadius: 7,

    backgroundColor: '#F0D060',

    marginRight: 9,
  },

  statusDotConnecting: {
    backgroundColor: '#899EEB',
  },

  statusDotConnected: {
    backgroundColor: '#55B878',
  },

  statusText: {
    flexShrink: 1,

    fontSize: 16,
    fontWeight: '700',

    color: '#30364D',

    textAlign: 'center',
  },

  // ==========================================================
  // BOTÕES
  // ==========================================================

  buttonsContainer: {
    width: '100%',
    alignItems: 'center',
  },

  // ==========================================================
  // BOTÃO BLUETOOTH
  // ==========================================================

  connectButton: {
    width: '100%',

    minHeight: 67,

    borderRadius: 18,

    backgroundColor: '#F0D060',

    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',

    paddingHorizontal: 18,

    gap: 10,

    shadowColor: '#30364D',
    shadowOffset: {
      width: 0,
      height: 5,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },

  connectButtonConnecting: {
    backgroundColor: '#899EEB',
  },

  connectButtonText: {
    flexShrink: 1,

    color: '#FFFFFF',

    fontSize: 17,
    fontWeight: '800',

    letterSpacing: 0.5,

    textAlign: 'center',
  },

  buttonTextSmall: {
    fontSize: 15,
  },

  // ==========================================================
  // CONTINUAR
  // ==========================================================

  continueWrapper: {
    width: '100%',
  },

  continueButton: {
    width: '100%',

    minHeight: 67,

    borderRadius: 18,

    backgroundColor: '#55B878',

    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',

    paddingHorizontal: 18,

    gap: 10,

    shadowColor: '#30364D',
    shadowOffset: {
      width: 0,
      height: 5,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },

  continueButtonText: {
    flexShrink: 1,

    color: '#FFFFFF',

    fontSize: 18,
    fontWeight: '800',

    letterSpacing: 0.7,

    textAlign: 'center',
  },

});

