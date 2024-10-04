import cryptoJs from 'crypto-js';
import { useEcardServer } from '../http/Client';

interface EcardAPI {
    openWater(ecard: string, money?: string, onSuccess?: Function, onError?: Function): void;
    closeWater(doorId?: string, onSuccess?: Function, onError?: Function): void;
    queryEleMoney(homeId?: string, onSuccess?: Function, onError?: Function): void;
    getUserInfo(userId: string, onSuccess?: Function, onError?: Function): void;
}

class UseEcardAPI implements EcardAPI {
    private urls = {
        waterUrl: '/GetValveInfo.aspx',
        loginUrl: '/AccountLogIn.aspx',
        queryUrl: '/GetUserInfoXT.aspx',
        userInfoUrl: '/QueryAccInfo.aspx',
        openWaterUrl: '/OpenWaterValve.aspx',
        closeWaterUrl: '/CloseWaterValve.aspx',
    };

    private Tool = {
        secretKey: 'ok15we1@oid8x5afd@',
    };

    private getFormatDate = (): string => {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const seconds = String(now.getSeconds()).padStart(2, '0');
        return `${year}${month}${day}${hours}${minutes}${seconds}`;
    }

    private calculateMD5 = (code: string): string => {
        const md5Hash = cryptoJs.MD5(code);
        return md5Hash.toString();
    }

    private getEncryptParams = (data: any): URLSearchParams => {
        data.Time = this.getFormatDate();
        const sortedKeys = Object.keys(data).sort();

        let concatenatedString = "";
        for (let i = 0; i < sortedKeys.length; i++) {
            concatenatedString += data[sortedKeys[i]] + "|";
        }

        data.Sign = this.calculateMD5(concatenatedString + this.Tool.secretKey);
        data.ContentType = "json";

        const body = new URLSearchParams();
        const specialKeysRegex = /NewPassword|IDNo|UserNumber|QueryPwd|SMSCode|SMSMsg_id|PwdProtectionCon|Mobile|OldPassword|Password|urlAsign/;
        const photoRegex = /Photo/;

        for (let key in data) {
            if (specialKeysRegex.test(key)) {
                if (key === "urlAsign") {
                    body.append('url', encodeURIComponent(data[key]));
                } else {
                    body.append(key, encodeURIComponent(data[key]));
                }
            } else if (photoRegex.test(key)) {
                body.append(key, data[key].replace(/\+/g, "%2B"));
            } else {
                body.append(key, data[key]);
            }
        }

        return body;
    }

    private sendRequest = async (url: string, body: URLSearchParams, onSuccess?: Function, onError?: Function) => {
        try {
            const resp = await useEcardServer.post(url, body, { timeout: 5000 });
            if (resp.data['Code'] === '1') {
                onSuccess && onSuccess(resp.data);
            } else {
                onError && onError(resp.data);
            }
        } catch (error) {
            console.error('Error during request:', error);
            onError && onError((error as any).response?.data || 'Request failed');
        }
    }

    openWater = (ecard: string, money: string = '2', onSuccess?: Function, onError?: Function) => {
        const params = {
            'AccNum': ecard,
            'StaNum': '229',
            'TerNum': '31',
            'ValveNum': '1',
            'Money': money,
        };
        const body = this.getEncryptParams(params);
        this.sendRequest(this.urls.openWaterUrl, body, onSuccess, onError);
    }

    closeWater = (doorId: string = '5399400', onSuccess?: Function, onError?: Function) => {
        const params = {
            'OrderNum': doorId,
        };
        const body = this.getEncryptParams(params);
        this.sendRequest(this.urls.closeWaterUrl, body, onSuccess, onError);
    }

    queryEleMoney = (homeId: string = '22-309', onSuccess?: Function, onError?: Function) => {
        const params = {
            'UserCode': homeId,
        };
        const body = this.getEncryptParams(params);
        this.sendRequest(this.urls.queryUrl, body, onSuccess, onError);
    }

    login = (username: string, password: string, onSuccess?: Function, onError?: Function) => {
        const params = {
            'UserNumber': username,
            'Password': password,
            'IMEI': '',
            'UserType': 3
        };
        const body = this.getEncryptParams(params);
        this.sendRequest(this.urls.loginUrl, body, onSuccess, onError);
    }

    getUserInfo = (userId: string, onSuccess?: Function, onError?: Function) => {
        const params = {
            'AccNum': userId,
        };
        const body = this.getEncryptParams(params);
        this.sendRequest(this.urls.userInfoUrl, body, onSuccess, onError);
    }
}

const useEcardAPI = new UseEcardAPI();
export default useEcardAPI;
