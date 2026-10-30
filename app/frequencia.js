import React from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useHeartRate } from '../ble/useHeartRate';

const C = {
  fundo: '#C9C3E6',
  branco: '#FFFFFF',
  texto: '#30364D',
  secundario: '#65708F',
  azul: '#5574B8',
  rosa: '#C65B69',
  rosaClaro: '#FBECEF',
  verde: '#4B8B76',
};

export default function Frequencia() {
  const insets = useSafeAreaInsets();
  const { status, bpm, contato, nomeDispositivo, mensagem, conectar, desconectar } =
    useHeartRate();

  const ocupado = status === 'scanning' || status === 'connecting' || status === 'reconnecting';
  const conectado = status === 'connected';

  return (
    <View style={[styles.container, { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 16 }]}>
      <TouchableOpacity style={styles.voltar} onPress={() => router.back()} accessibilityLabel="Voltar">
        <Ionicons name="chevron-back" size={26} color={C.texto} />
      </TouchableOpacity>

      <Text style={styles.titulo}>SENSOR DE BATIMENTOS</Text>

      <View style={styles.card}>
        <View style={styles.icone}>
          {ocupado ? (
            <ActivityIndicator size="large" color={C.rosa} />
          ) : (
            <Ionicons name="heart" size={44} color={C.rosa} />
          )}
        </View>

        <View style={styles.linhaValor}>
          <Text style={styles.valor}>{bpm ?? '--'}</Text>
          <Text style={styles.unidade}>bpm</Text>
        </View>

        {conectado && nomeDispositivo ? (
          <Text style={styles.nome}>{nomeDispositivo}</Text>
        ) : null}

        {conectado && contato === false ? (
          <Text style={styles.aviso}>Sem contato com a pele. Ajuste o sensor.</Text>
        ) : null}

        <Text style={[styles.mensagem, status === 'error' && { color: C.rosa }]}>{mensagem}</Text>
      </View>

      {conectado || status === 'reconnecting' ? (
        <TouchableOpacity style={[styles.botao, styles.botaoSecundario]} onPress={desconectar}>
          <Text style={[styles.botaoTexto, { color: C.texto }]}>DESCONECTAR</Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity
          style={[styles.botao, ocupado && { opacity: 0.6 }]}
          onPress={conectar}
          disabled={ocupado}
        >
          <Text style={styles.botaoTexto}>{ocupado ? 'AGUARDE...' : 'CONECTAR SENSOR'}</Text>
        </TouchableOpacity>
      )}

      <Text style={styles.dica}>
        Use uma cinta ou sensor BLE compatível com o perfil padrão de frequência cardíaca. Feche
        outros apps que estejam conectados ao sensor: a maioria só aceita uma conexão.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.fundo, paddingHorizontal: 24 },
  voltar: { width: 40, height: 40, justifyContent: 'center' },
  titulo: { fontSize: 22, fontWeight: '800', color: C.texto, textAlign: 'center', marginVertical: 12 },
  card: {
    backgroundColor: C.branco,
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 24,
  },
  icone: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: C.rosaClaro,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  linhaValor: { flexDirection: 'row', alignItems: 'flex-end' },
  valor: { fontSize: 64, fontWeight: '800', color: C.texto },
  unidade: { fontSize: 18, color: C.secundario, marginLeft: 6, marginBottom: 12 },
  nome: { fontSize: 14, color: C.verde, fontWeight: '700', marginTop: 4 },
  aviso: { fontSize: 13, color: C.rosa, marginTop: 8, textAlign: 'center' },
  mensagem: { fontSize: 14, color: C.secundario, marginTop: 12, textAlign: 'center' },
  botao: { backgroundColor: C.azul, borderRadius: 18, paddingVertical: 16, alignItems: 'center' },
  botaoSecundario: { backgroundColor: C.branco },
  botaoTexto: { color: C.branco, fontSize: 15, fontWeight: '800', letterSpacing: 0.5 },
  dica: { fontSize: 12, color: C.secundario, textAlign: 'center', marginTop: 20, lineHeight: 18 },
});
