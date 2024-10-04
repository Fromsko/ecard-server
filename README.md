# Ecard server on Vercel

> 湖南信息职院 一卡通水卡服务系统
>
> 通过模拟调用, 为学院学生减少因`系统维护`等时间等待
>
> 方便使用 API 接口接入自定义的 App 程序中便捷使用

## 功能实现

`语言:` Typescript

`框架:` Axios | express

### 具体实现

+ Axios 请求库的封装
+ 一言接口的实现
+ 一卡通接口定义
+ 访问日志的记录
+ 访问权限控制 `/api/task/encry.ts` 里面逻辑

---
<details>
<summary>接口定义</summary>

`一卡通接口`

```ts
interface EcardAPI {
    openWater(ecard: string, money?: string, onSuccess?: Function, onError?: Function): void;
    closeWater(doorId?: string, onSuccess?: Function, onError?: Function): void;
    queryEleMoney(homeId?: string, onSuccess?: Function, onError?: Function): void;
    getUserInfo(userId: string, onSuccess?: Function, onError?: Function): void;
}
```

`一言接口`

```ts
const useOneSayAPI = {
    custom: async (req: any) => {
        let resp: any = await useOneSayServer.get('/', req.query)
        return {
            "句子": resp['hitokoto'],
            "来源": resp['from'] ?? '',
            "时间": resp['created_at'] ?? '',
        }
    }
}
```

`授权认证` `/api/task/encry.ts`

```ts
const useAuthgenerate = (): string => {
    const now = new Date()
    const year = now.getFullYear().toString()
    const month = ('0' + (now.getMonth() + 1)).slice(-2)
    const day = ('0' + now.getDate()).slice(-2)
    const hour = ('0' + now.getHours()).slice(-2)

    const keyString = `${year}${month}${day}${hour}`;
    return `sk-${generateHmac(keyString)}`
}
```

`核心实现`

```ts
// 一卡通接口
app.get('/ecard', authMiddleware, async (req, res) => {
    // get server
    interface openParmas {
        service?: string
        money?: string
        userId?: string
        doorId?: string
        homeId?: string
    }
    let parmas: openParmas = req.query
    let { openWater, closeWater, queryEleMoney, getUserInfo } = useEcardAPI

    switch (parmas.service) {
        case 'open':
            openWater(
                parmas.userId ?? '',
                parmas.money,
                (resp: any) => {
                    res.send({
                        code: 200,
                        msg: '热水开启成功',
                        money: parmas.money ?? '2',
                        doorId: resp['OrderNum']
                    })
                }, (e: { Code: string, Msg: string }) => {
                    res.send({
                        code: 400,
                        msg: '热水开启失败',
                        err: e['Msg'],
                    })
                }
            )
            break;
        case 'close':
            closeWater(
                parmas.doorId,
                (resp: any) => {
                    res.send({
                        code: 200,
                        msg: '热水关闭成功',
                        doorId: parmas.doorId ?? '5399400',
                    })
                }, (e: { Code: string, Msg: string }) => {
                    res.send({
                        code: 400,
                        msg: '热水关闭失败',
                        err: e['Msg'],
                    })
                }
            )
            break;
        case 'ele':
            queryEleMoney(
                parmas.homeId,
                (resp: any) => {
                    res.send({
                        code: 200,
                        msg: "查询成功",
                        homeId: parmas.homeId ?? '20-409',
                        time: resp['ReadTime'],
                        money: resp['Reserve']
                    })
                }, (e: { Code: string, Msg: string }) => {
                    res.send({
                        code: 400,
                        msg: '查询失败',
                        err: e['Msg'],
                    })
                }
            )
            break;
        case 'user':
            getUserInfo(
                parmas.userId ?? '',
                (resp: any) => {
                    res.send({
                        code: 200,
                        msg: resp['Msg'],
                        schoolId: resp['PerCode'],
                        userName: resp['AccName'],
                        className: resp['DepName'],
                        userId: resp['Rows']['AccNum']
                    })
                }, (e: { Code: string, Msg: string }) => {
                    res.send({
                        code: 400,
                        msg: '查询失败',
                        err: e['Msg'],
                    })
                }
            )
            break;
        default:
            res.status(401).json({ error: '未知参数!' });
            break;
    }
});
```

</details>

<details>
<summary>一卡通接口</summary>

接口地址:  `/ecard?service=&userId=&homeId=&doorId`

| 参数   | 说明    | 可选 |
| ---- | ---- |----|
| `service`    | 服务名  | `open`, `close`, `ele`, `user` |
| `userId`   | 一卡通号    | √ |
| `homeId`    | 房间号    | 配合电费查询|
| `doorId`    | 水阀号    | 配合水阀使用|

</details>

<details>
<summary>Axios 封装</summary>

```ts
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

// 使用
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

const useOneSayAPI = {
    custom: async (req: any) => {
        let resp: any = await useOneSayServer.get('/', req.query)
        return {
            "句子": resp['hitokoto'],
            "来源": resp['from'] ?? '',
            "时间": resp['created_at'] ?? '',
        }
    }
}
```

</details>

## 部署

### 基础部署

```shell
npm i && npm run start
```

### 一键部署

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/git/external?repository-url=https://github.com/Fromsko/easy_api.git)
