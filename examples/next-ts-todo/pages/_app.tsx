import 'bootstrap/dist/css/bootstrap.min.css';

if (typeof window !== 'undefined') {  
  import('bootstrap');
}

function MyApp({ Component, pageProps }) {
  return <Component {...pageProps} />
}

export default MyApp
