export function getCurrentTimestamp(){

    return `${new Date().toLocaleDateString("en-GB")}, ${new Date().toLocaleTimeString()}`;

}