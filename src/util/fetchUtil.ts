export const callApi = async (apiPath: string) => {
    return await fetch(`/api/${apiPath}`).then(response => response.json())
}
