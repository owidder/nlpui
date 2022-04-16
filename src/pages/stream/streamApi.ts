const decoder = new TextDecoder();

export const callStreamApi = async (apiPath: string, callback: (string) => void, method = "GET", body?: any) => {
    console.log(`fetch: ${apiPath}`)
    const response = await fetch(apiPath, {
        method,
        headers: method == "GET" ? undefined : {"Content-Type": "application/json", "Accept": "application/json; charset=UTF-8"},
        body: body ? JSON.stringify(body) : undefined
    });
    return new Promise<void>(async resolve => {
        console.log(`about to get reader: ${apiPath}`)
        const reader = response.body.getReader();
        console.log(`got: ${apiPath}`)
        while(true) {
            const {done, value} = await reader.read();
            const decoded = decoder.decode(value);
            console.log(`decoded: ${apiPath} = ${decoded.substring(0, 10)}`)
            callback(decoded);
            if(done) {
                console.log(`done: ${apiPath}`);
                resolve();
                break;
            }
        }
    })
}

