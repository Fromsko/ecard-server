require('dotenv').config();
import express, { Request, Response } from "express";
import path from "path";
import useEcardAPI from "./task/ecard";
import useAuthgenerate from './task/encry';
import useOneSayAPI from "./task/onesay";

const app = express();
const MAX_LOGS = 2000;

let accessLogs: {
    ip?: string;
    AccessTime: Date;
}[] = [];


app.set('views', path.join(__dirname, '..', 'views'));

app.set('view engine', 'ejs'); // 使用 EJS 模板引擎

app.use(express.static(path.join(__dirname, 'public')));

app.use((req: Request, res: Response, next) => {
    const ip = req.ip || req.headers['x-forwarded-for'] as string;

    const index = accessLogs.findIndex(log => log.ip === ip);
    if (index !== -1) {
        accessLogs[index].AccessTime = new Date();
    } else {
        const newLog = {
            ip: ip,
            AccessTime: new Date()
        };
        if (accessLogs.length >= MAX_LOGS) {
            accessLogs.shift();
        }
        accessLogs.push(newLog);
    }
    next();
});

app.get('/', (req, res) => {
    res.status(200).sendFile(path.join(__dirname, '..', 'views', 'index.html'));
});

app.get('/about', (req, res) => {
    res.status(200).render('about', { accessLogs });
});

// Middleware: 验证 Auth 头是否正确
const authMiddleware = (req: Request, res: Response, next: () => void) => {
    const authHeader = req.headers['authorization'] as string;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: '无权访问该节点!' });
    }

    const generatedAuth = useAuthgenerate();
    if (authHeader.slice(7) !== generatedAuth) {
        return res.status(401).json({ error: '签名校验失败!' });
    }
    next();
}

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
                        homeId: parmas.homeId ?? '23-409',
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

// 一言接口
app.get('/oneSay', async (req, res) => {
    let { custom } = useOneSayAPI

    res.send(await custom(req));
});

// 处理未匹配的路由
app.use('*', (req: Request, res: Response) => {
    res.status(404).json({ error: '无法访问路径' });
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
module.exports = app;