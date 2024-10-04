import axios, { AxiosResponse, InternalAxiosRequestConfig } from 'axios';

class AxiosBuilder {
    config: { baseURL: string; headers: {}; timeout: number; };
    requestInterceptor: { onFulfilled: ((value: InternalAxiosRequestConfig<any>) => InternalAxiosRequestConfig<any> | Promise<InternalAxiosRequestConfig<any>>) | null, onRejected?: ((error: any) => any) | null };
    responseInterceptor: { onFulfilled: ((value: AxiosResponse<any, any>) => AxiosResponse<any, any> | Promise<AxiosResponse<any, any>>) | null, onRejected?: ((error: any) => any) | null };

    constructor() {
        this.config = {
            baseURL: '',
            headers: {},
            timeout: 10000,
        };
        this.requestInterceptor = { onFulfilled: null, onRejected: null };
        this.responseInterceptor = { onFulfilled: null, onRejected: null };
    }

    setBaseURL(baseURL: string) {
        this.config.baseURL = baseURL;
        return this;
    }

    setHeaders(headers: {}) {
        this.config.headers = headers;
        return this;
    }

    setTimeout(timeout: number) {
        this.config.timeout = timeout;
        return this;
    }

    addRequestInterceptor(onFulfilled: (value: InternalAxiosRequestConfig<any>) => InternalAxiosRequestConfig<any> | Promise<InternalAxiosRequestConfig<any>>, onRejected?: (error: any) => any) {
        this.requestInterceptor = { onFulfilled, onRejected: onRejected || null };
        return this;
    }

    addResponseInterceptor(onFulfilled: (value: AxiosResponse<any, any>) => AxiosResponse<any, any> | Promise<AxiosResponse<any, any>>, onRejected?: (error: any) => any) {
        this.responseInterceptor = { onFulfilled, onRejected: onRejected || null };
        return this;
    }

    build() {
        const instance = axios.create(this.config);

        // Apply request interceptor
        if (this.requestInterceptor.onFulfilled) {
            instance.interceptors.request.use(this.requestInterceptor.onFulfilled, this.requestInterceptor.onRejected);
        } else {
            // Add a default request interceptor if none are set
            instance.interceptors.request.use((config: InternalAxiosRequestConfig<any>) => {
                config.headers['User-Agent'] = 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1 Edg/123.0.0.0'
                return config;
            }, (error: any) => {
                return Promise.reject(error);
            });
        }

        // Apply response interceptor
        if (this.responseInterceptor.onFulfilled) {
            instance.interceptors.response.use(this.responseInterceptor.onFulfilled, this.responseInterceptor.onRejected);
        }

        return instance;
    }
}

export default AxiosBuilder;
