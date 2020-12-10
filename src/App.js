import { useCallback, useState } from 'react'
import { GlobalWorkerOptions, getDocument } from 'pdfjs-dist/build/pdf'
// import PDFJS from './pdf'

GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.5.207/pdf.worker.js";

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
  return new Promise(resolve => {
    getDocument(url).promise.then(function (PDFDocumentInstance) {
      console.log({PDFDocumentInstance})
      getPageText(1, PDFDocumentInstance).then(res => resolve(res))
    }, function (reason) {
        console.error(reason);
    });
  })
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

const alignCenterBit = new Uint8Array([27, 97, 1])
const alignRightBit = new Uint8Array([27, 97, 2])
const alignLeftBit = new Uint8Array([27, 97, 0])
const boldBit = new Uint8Array([27,69,3])
const unBoldBit = new Uint8Array([27,69,0])
const strToBit = val => {
  const enc = new TextEncoder()
  return new Uint8Array(enc.encode(val))
}
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

const usePrint = (param = {}) => {
  const { filters } = param
  const [printerChar, setPrinterChar] = useState(null)
  const connect = useCallback(async () => {
    const options = {
      optionalServices: ['49535343-fe7d-4ae5-8fa9-9fafd205e455']
    }
    if (!filters || !filters.length) {
      options.acceptAllDevices = true
    } else {
      options.filters = filters
    }
    navigator.bluetooth.requestDevice(options)
    .then(device => {
      console.log({device: device.gatt})
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
      return setPrinterChar(characteristic)
    })
    .then(param => {
        alert('Connected', param);
    })
    .catch(err => {
      console.log(err)
      window.alert(err.message)
    })
  }, [filters])

  const print = async () => {
    if (!printerChar) {
      alert('Connect first')
      return
    }
    // extractText('https://storage.googleapis.com/wedocation-asset/41192138433.pdf')
    //   .then(res => {
    //     console.log({res})
    //   })
    try {
      await printerChar.writeValue(new Uint8Array([27,64])) // reset default setting
      await printerChar.writeValue(new Uint8Array([27, 51, 2])) // change line height
      await printerChar.writeValue(alignCenterBit)
      await printerChar.writeValue(strToBit('\neMedika\n'))
      await printerChar.writeValue(strToBit('Transaction ID: 4\n'))
      await printerChar.writeValue(strToBit("\n"))
      
      await printerChar.writeValue(strToBit('November 5, 2020\n'))
      
      await printerChar.writeValue(alignLeftBit)
      await printerChar.writeValue(strToBit("Pharmaton x13\n"))
      
      await printerChar.writeValue(alignRightBit)
      await printerChar.writeValue(strToBit("Rp 45.000\n"))
      await printerChar.writeValue(alignLeftBit)
      await printerChar.writeValue(strToBit("Bisolvon x2\n"))
      await printerChar.writeValue(alignRightBit)
      await printerChar.writeValue(strToBit("Rp 5.000\n"))
      await printerChar.writeValue(strToBit("\n"))
      await printerChar.writeValue(alignLeftBit)
      await printerChar.writeValue(strToBit("Sub Total\n"))
      await printerChar.writeValue(alignRightBit)
      await printerChar.writeValue(strToBit("Rp 50.000\n"))
      await printerChar.writeValue(alignLeftBit)
      await printerChar.writeValue(strToBit("Tax\n"))
      await printerChar.writeValue(alignRightBit)
      await printerChar.writeValue(strToBit("Rp 5.000\n"))
      await printerChar.writeValue(strToBit("\n"))
      await printerChar.writeValue(boldBit)
      await printerChar.writeValue(alignLeftBit)
      await printerChar.writeValue(strToBit("Total\n"))
      await printerChar.writeValue(alignRightBit)
      await printerChar.writeValue(strToBit("Rp 55.000\n"))
      await printerChar.writeValue(unBoldBit)
      await printerChar.writeValue(alignLeftBit)
      await printerChar.writeValue(strToBit("Terima kasih!\n"))
      await printerChar.writeValue(strToBit("\n"))
      await printerChar.writeValue(strToBit("\n"))

      alert('printed')
    } catch (err) {
      alert(err.message)
    }
  }

  return { connect, print }
}

function App() {
  const { print, connect } = usePrint({
    filters: [{
      name: ['RPP02N']
    }]
  })
  return (
    <div>
    <button onClick={connect}>Connect</button>
    <button onClick={() => {
      print()
    }}>Print</button>
    </div>
  );
}

export default App;