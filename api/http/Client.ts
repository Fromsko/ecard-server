import AxiosBuilder from './AxiosBuilder';

const useEcardServer = new AxiosBuilder()
    .setBaseURL('https://ecard.hniu.cn:9029')
    .setHeaders(
        {
            'Accept': 'application/json, text/plain, */*'
        }
    )
    .addResponseInterceptor(
        (response: any) => {
            const path = response.request.path
            if (path === '/AccountLogIn.aspx' && response.status === 200) {
                const auth = {
                    cookies: response.headers["set-cookie"][0].split(';')[0],
                    token: response.data["UserToken"],
                }
                return auth
            }
            return response
        }, (error: any) => {
            return Promise.reject(error)
        }
    )
    .build();

const useOneSayServer = new AxiosBuilder()
    .setBaseURL('https://v1.hitokoto.cn')
    .setHeaders(
        {
            'Accept': 'application/json, text/plain, */*'
        }
    )
    .addResponseInterceptor(
        (response: any) => {
            if (response.status === 200)
                return response.data;
        }, (error: any) => {
            return Promise.reject(error)
        }
    )
    .build();

export { useEcardServer, useOneSayServer };

