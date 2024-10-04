import { useOneSayServer } from "../http/Client";

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

export default useOneSayAPI;