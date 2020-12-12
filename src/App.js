import { useCallback, useState } from 'react'
import { ApolloClient, InMemoryCache, gql } from '@apollo/client';

const client = new ApolloClient({
  uri: 'https://user.stage.emedika.id/graphql',
  cache: new InMemoryCache(),
  fetch,
  fetchOptions: {
    mode: 'no-cors',
  },
  headers: {
    'Access-Control-Allow-Origin': '*',
    "Access-Control-Allow-Credentials" : true,
    authorization: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlcyI6W3siZGVsZXRlZCI6ZmFsc2UsIl9pZCI6IjVmODJlMWE3NjU5MTE2NTcxNDQyY2QwOSIsIm5hbWUiOiJzdXBlcmFkbWluIn1dLCJkZWxldGVkIjpmYWxzZSwiX2lkIjoiNWY4MmUyOTk1NWFmODY0NjUyZGUwNzY5IiwiZW1haWwiOiJyb2ZpQG1haWwuY29tIiwibmFtZSI6IlJvZmkiLCJjcmVhdGVkX2F0IjoiMjAyMC0xMC0xMVQxMDo0Njo0OS4zNjFaIiwidXBkYXRlZF9hdCI6IjIwMjAtMTAtMzBUMTY6MDE6NTEuMTI1WiIsIl9fdiI6MCwiaWF0IjoxNjA3NjUyOTY5fQ.oEq5mXxtWeoIV5gADOgiX_-c575TPm80uptg7mmQlQY'
  },
});

const alignCenterBit = new Uint8Array([27, 97, 1])
const alignRightBit = new Uint8Array([27, 97, 2])
const alignLeftBit = new Uint8Array([27, 97, 0])
const boldBit = new Uint8Array([27,69,3])
const unBoldBit = new Uint8Array([27,69,0])
const lineCode = new Uint8Array([...Array(512)].map(() => 95))

const strToBit = val => {
  const enc = new TextEncoder()
  return new Uint8Array(enc.encode(val))
}


// const content = `
//   <center>eMedika</center><br/>
//   <center>Transaction ID: 4</center><br/>
//   <center>5 November, 2020</center><br/>
//   <line/><br/>
//   <newline/><br/>
//   Pharmaton x2<br/>
//   <right>Rp 25.000</right><br/>
//   Bisolvon x3 <br/>
//   <right>Rp 30.000</right><br/>
//   <line/><br/>
//   Sub Total<br/>
//   <right>Rp 55.000</right><br/>
//   Tax <br/>
//   <right>Rp 5.500</right><br/>
//   <b>Total</b> <br/>
//   <right><b>Rp 60.500</b></right><br/>
//   <newline/><br/>
//   <newline/><br/>
// `

const parseTextToByte = txt => {
  const str = txt.replace(/\s+/g, " ")
  const lines = str.split('<br/>')
  console.log(lines)
  const result = []
  for (const line of lines) {
    if (line.search(/(<([^>]+)>)/gi) !== -1) {
      const parsed = line.split(/<|>/gi).filter(item => !!item && item !== " ")
      console.log(parsed)
      if (!['center', 'right'].includes(parsed[0])) {
        result.push(alignLeftBit)
      }
      for (const itemParsed of parsed) {
        switch (itemParsed) {
          case 'center':
            result.push(alignCenterBit)
            break
          case 'right':
            result.push(alignRightBit)
            break
          case 'b':
            result.push(boldBit)
            break;
          case '/b':
            result.push(unBoldBit)
            break
          case '/right':
          case '/center':
            result.push(alignLeftBit)
            break;
          case 'line/':
            result.push(lineCode)
            result.push(lineCode)
            break
          case 'newline/':
              result.push(strToBit(" "))
              break
          // Add more option here
          default:
            result.push(strToBit(itemParsed))
            break
        }
      }
    } else {
      result.push(alignLeftBit)
      result.push(strToBit(line))
    }
    result.push(strToBit('\n'))
  }
  return result
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
      return device.gatt.connect()
    })
    .then(server => {
      return server.getPrimaryService('49535343-fe7d-4ae5-8fa9-9fafd205e455')
    })
    .then(service => {
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
    try {
      const { data: invoice } = await client.query({
        query: gql`
          query GetPrintableTrxInvoice {
            GetPrintableTrxInvoice(id: 4) 
          }
        `,
      })

      const content = invoice.GetPrintableTrxInvoice

      await printerChar.writeValue(new Uint8Array([27,64])) // reset default setting
      await printerChar.writeValue(new Uint8Array([27, 51, 2])) // change line height
      await printerChar.writeValue(new Uint8Array([27, 33, 1])) // choose smaller font

      const lines = parseTextToByte(content)
      for (const line of lines) {
        await printerChar.writeValue(line)
      }

      await printerChar.writeValue(strToBit('\n'))
      await printerChar.writeValue(strToBit('hello'))

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