import * as crypto from 'crypto';

const secretKey = process.env.SECRET_KEY || 'skongan666';
console.log( process.env.SECRET_KEY, secretKey)

const generateHmac = (message: string): string => {
    const hmac = crypto.createHmac('sha256', secretKey);
    hmac.update(message);
    return hmac.digest('hex');
}

const useAuthgenerate = (): string => {
    const now = new Date()
    const year = now.getFullYear().toString()
    const month = ('0' + (now.getMonth() + 1)).slice(-2)
    const day = ('0' + now.getDate()).slice(-2)
    const hour = ('0' + now.getHours()).slice(-2)

    const keyString = `${year}${month}${day}${hour}`;
    return `sk-${generateHmac(keyString)}`
}

export default useAuthgenerate;
