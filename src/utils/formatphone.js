// utils/formatphone.js
const formatphone = (phone) => {
    if (!phone) return '';
    
    // Remove tudo que não for número
    const onlyNums = phone.toString().replace(/\D/g, '');

    if (onlyNums.length <= 10) {
        // Telefone fixo (8 dígitos)
        return onlyNums
            .replace(/^(\d{2})(\d)/, '($1) $2')
            .replace(/(\d{4})(\d)/, '$1-$2');
    } else {
        // Celular (9 dígitos)
        return onlyNums
            .replace(/^(\d{2})(\d)/, '($1) $2')
            .replace(/(\d{1})(\d{4})(\d)/, '$1 $2-$3');
    }
};

export default formatphone;