import { customAlphabet } from 'nanoid';

export function generateShortCode()
{
    const alphabet = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz-_';
    const generate = customAlphabet(alphabet, 8);
    return generate();
}
