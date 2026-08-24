// pages/_document.js
import { Html, Head, Main, NextScript } from 'next/document'

export default function Document() {
  return (
    <Html lang="id"> {/* ✅ Perbaikan: atribut lang untuk aksesibilitas */}
      <Head />
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  )
}
