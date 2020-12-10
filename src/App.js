import { useCallback } from 'react'
import {GlobalWorkerOptions, getDocument, version} from 'pdfjs-dist/build/pdf';

GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${version}/pdf.worker.js`
// window.PDFJS.workerSrc = '//cdnjs.cloudflare.com/ajax/libs/pdf.js/1.8.357/pdf.worker.js'

const base64ToArrayBuffer = (base64) => {
  const binary_string = window.atob(base64);
  const len = binary_string.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
      bytes[i] = binary_string.charCodeAt(i);
  }
  return bytes.buffer;
}

function base64ToUint8Array(base64) {
  const raw = atob(base64); 
  const uint8Array = new Uint8Array(new ArrayBuffer(raw.length));
  for (let i = 0; i < raw.length; i++) {
    uint8Array[i] = raw.charCodeAt(i);
  }
  return uint8Array;
}

function getPageText(pageNum, PDFDocumentInstance) {
  // Return a Promise that is solved once the text of the page is retrieven
  return new Promise(function (resolve, reject) {
      PDFDocumentInstance.getPage(pageNum).then(function (pdfPage) {
          // The main trick to obtain the text of the PDF page, use the getTextContent method
          pdfPage.getTextContent().then(function (textContent) {
              const textItems = textContent.items;
              let finalString = "";

              // Concatenate the string of the item to the final string
              for (let i = 0; i < textItems.length; i++) {
                  const item = textItems[i];

                  finalString += item.str + " ";
              }

              // Solve promise with the text retrieven from the page
              resolve(finalString);
          });
      });
  });
}

const extractText = url => {
  getDocument(url).promise.then(function (PDFDocumentInstance) {
    getPageText(1, PDFDocumentInstance).then(res => console.log({res}))
    // Use the PDFDocumentInstance To extract the text later

  }, function (reason) {
      // PDF loading error
      console.error(reason);
  });
}

const toDataUrl = (url) => {
  return new Promise(resolve => {
    const xhr = new XMLHttpRequest();
    xhr.onload = function() {
        const reader = new FileReader();
        reader.onloadend = function() {
          console.log(reader.result.split(',')[1])
            resolve(base64ToUint8Array(reader.result.split(',')[1]));
        }
        reader.readAsDataURL(xhr.response);
    };
    xhr.open('GET', url);
    xhr.responseType = 'blob';
    xhr.send();
  })
}

const usePrint = (param = {}) => {
  const { filters } = param
  const print = useCallback(async (content) => {
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
      // var enc = new TextEncoder(); // always utf-8
      // const val = enc.encode("\n=====Leo Tampan Sekali\n")
      // console.log({val})
      // toDataUrl('/public/4.pdf').then(res => {

      // })
      return characteristic.writeValue(content);
    })
    .then(param => {
      alert('Msg sent', param);
    })
    .catch(err => window.alert(err.message))
  }, [filters])

  return { print }
}

function App() {
  const { print } = usePrint({
    // filters: [{
    //   services: [0x1801]
    // }]
  })
  return (
    <div>
    <button onClick={() => {
      extractText('/public/4.pdf')//.then(res => print(res))
    }}>PDF</button>
    </div>
  );
}

export default App;