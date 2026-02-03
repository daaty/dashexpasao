// Criar este script para verificar dados em storage
console.log('=== VERIFICANDO STORAGE ===');
console.log('localStorage length:', localStorage.length);
console.log('sessionStorage length:', sessionStorage.length);

console.log('\n=== CHAVES EM LOCALSTORAGE ===');
for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    const value = localStorage.getItem(key);
    if (key && (key.includes('cidade') || key.includes('city') || key.includes('urban') || key.includes('planejamento'))) {
        console.log(`${key}:`, value ? value.substring(0, 100) + '...' : 'null');
    }
}

console.log('\n=== CHAVES EM SESSIONSTORAGE ===');
for (let i = 0; i < sessionStorage.length; i++) {
    const key = sessionStorage.key(i);
    const value = sessionStorage.getItem(key);
    if (key && (key.includes('cidade') || key.includes('city') || key.includes('urban') || key.includes('planejamento'))) {
        console.log(`${key}:`, value ? value.substring(0, 100) + '...' : 'null');
    }
}

console.log('\n=== TENTANDO FETCH PARA API ===');
fetch('/api/cities')
    .then(response => {
        console.log('API Response Status:', response.status);
        return response.json();
    })
    .then(data => {
        console.log('API Response Data:', data);
    })
    .catch(error => {
        console.log('API Error:', error);
    });