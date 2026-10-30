import { Buffer } from 'buffer';

// Perfil padrão Heart Rate (Bluetooth SIG).
export const HR_SERVICE_UUID = '0000180d-0000-1000-8000-00805f9b34fb';
export const HR_MEASUREMENT_UUID = '00002a37-0000-1000-8000-00805f9b34fb';

// Interpreta a característica Heart Rate Measurement (0x2A37).
// byte 0 = flags:
//   bit 0: formato do BPM (0 = uint8, 1 = uint16)
//   bit 1: contato com a pele detectado (válido se bit 2 = 1)
//   bit 2: sensor suporta detecção de contato
// Devolve { bpm, contato } ou lança erro se o pacote for inválido.
export function interpretarFrequenciaCardiaca(base64) {
  const bytes = Buffer.from(base64, 'base64');

  if (bytes.length < 2) {
    throw new Error('Pacote de frequência cardíaca incompleto.');
  }

  const flags = bytes[0];
  const bpm16 = (flags & 0x01) !== 0;

  if (bpm16 && bytes.length < 3) {
    throw new Error('Pacote de frequência cardíaca incompleto.');
  }

  const bpm = bpm16 ? bytes.readUInt16LE(1) : bytes[1];
  const contatoSuportado = (flags & 0x04) !== 0;
  const contato = contatoSuportado ? (flags & 0x02) !== 0 : null;

  return { bpm, contato };
}

// Descarta leituras fisiologicamente implausíveis (sensor sem contato, ruído).
export function bpmValido(bpm) {
  return Number.isFinite(bpm) && bpm >= 30 && bpm <= 230;
}
