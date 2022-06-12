export const callApi = async (apiPath: string, method = "GET", body?: any) => {
    return await fetch(apiPath, {
        method,
        headers: method == "GET" ? undefined : {"Content-Type": "application/json", "Accept": "application/json; charset=UTF-8"},
        body: body ? JSON.stringify(body) : undefined
    }).then(response => response.json())
}
