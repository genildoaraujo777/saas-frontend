import axios from 'axios';
// @ts-ignore
const BASE_URL = import.meta.env.VITE_BASE_URL;

const api = axios.create({
    baseURL: BASE_URL
})

// const api = axios.create({
//     baseURL: 'https://gateway.fbmstore.com.br'
// })

export default api;