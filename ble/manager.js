import { Platform } from 'react-native';
import { BleManager } from 'react-native-ble-plx';

// Instância única de BleManager para todo o app.
// BLE só existe em Android/iOS. Na versão web (ou sem módulo nativo)
// exportamos um substituto que falha com mensagem clara, em vez de
// derrubar o app inteiro na importação.
function criarManager() {
  if (Platform.OS === 'web') return null;

  try {
    return new BleManager();
  } catch (erro) {
    console.warn('BLE indisponível:', erro?.message);
    return null;
  }
}

const real = criarManager();

const indisponivel = () =>
  Promise.reject(new Error('Bluetooth indisponível neste dispositivo.'));

const substituto = {
  state: () => Promise.resolve('Unsupported'),
  onStateChange: () => ({ remove() {} }),
  startDeviceScan: (_u, _o, cb) => cb(new Error('Bluetooth indisponível neste dispositivo.'), null),
  stopDeviceScan: () => {},
  connectToDevice: indisponivel,
  cancelDeviceConnection: indisponivel,
  monitorCharacteristicForDevice: () => ({ remove() {} }),
};

export const manager = real || substituto;