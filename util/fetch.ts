import axios from 'axios';

export const getCookie = (name: string) => {
    const arr = document.cookie.split('; ');
    const pos = arr.findIndex((str) => str.includes(name));
    if(pos === -1) {
        return;
    }
    const value = arr[pos].split('=')[1];
    return value;
}

export const base = axios.create({
    baseURL: '/api',
    timeout: 3000,
    validateStatus: function(status) {
        return status < 400;
    },
    withCredentials: true,
})

base.interceptors.request.use((req) => {
    req['headers']['Authorization'] = `Bearer ${getCookie('auth-token')}`;
    return req;
})

