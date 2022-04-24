const decoder = new TextDecoder();

export const callStreamApi = async (apiPath: string, callback: (string) => void, method = "GET", body?: any) => {
    const response = await fetch(apiPath, {
        method,
        headers: method == "GET" ? undefined : {"Content-Type": "application/json", "Accept": "application/json; charset=UTF-8"},
        body: body ? JSON.stringify(body) : undefined
    });
    return new Promise<void>(async resolve => {
        const reader = response.body.getReader();
        while(true) {
            const {done, value} = await reader.read();
            const decoded = decoder.decode(value);
            callback(decoded);
            if(done) {
                resolve();
                break;
            }
        }
    })
}

