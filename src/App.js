import { useCallback, useState } from 'react'

const base64ToArrayBuffer = (base64) => {
  const binary_string = window.atob(base64);
  const len = binary_string.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
      bytes[i] = binary_string.charCodeAt(i);
  }
  return bytes.buffer;
}

const toDataUrl = (url) => {
  return new Promise(resolve => {
    var xhr = new XMLHttpRequest();
    xhr.onload = function() {
        var reader = new FileReader();
        reader.onloadend = function() {
          console.log(reader.result.split(',')[1])
            resolve(base64ToArrayBuffer(reader.result.split(',')[1]));
        }
        reader.readAsDataURL(xhr.response);
    };
    xhr.open('GET', url);
    xhr.responseType = 'blob';
    xhr.send();
  })
}

const useNavigator = (param = {}) => {
  const { filters } = param
  const devicePrint = useCallback(async () => {
    const options = {
      optionalServices: ['49535343-fe7d-4ae5-8fa9-9fafd205e455']
    }
    if (!filters || !filters.length) {
      options.acceptAllDevices = true
    } else {
      options.filters = filters
    }
    console.log('options', options)
    navigator.bluetooth.requestDevice(options)
    .then(device => {
      console.log({device})
      return device.gatt.connect()
    })
    .then(server => {
      console.log({server})
      return server.getPrimaryService('49535343-fe7d-4ae5-8fa9-9fafd205e455')
    })
    .then(service => {
      console.log({service})
      return service.getCharacteristic('49535343-8841-43f4-a8d4-ecbe34729bb3');
    })
    .then(characteristic => {
      var enc = new TextEncoder(); // always utf-8
      const val = enc.encode("Leo Tampan Sekali")
      console.log({val})
      characteristic.writeValue(enc.encode('\n'));
      characteristic.writeValue(enc.encode('\n'));
      return characteristic.writeValue(val);
    })
    .then(param => {
      alert('Msg sent', param);
    })
    .catch(err => window.alert(err.message))
  }, [filters])

  return { devicePrint}
}

function App() {
  const { devicePrint } = useNavigator({
    // filters: [{
    //   services: [0x1801]
    // }]
  })
  return (
    <div>
    <button onClick={devicePrint}>Detect</button>
    </div>
  );
}

export default App;