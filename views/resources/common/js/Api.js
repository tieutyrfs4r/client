import axios from 'axios';
import Cookies from 'js-cookie';

const instance = axios.create({
    withCredentials: true,
});

export const fixUrl = (url) => {
    url = url.toString();
    const hostname = location.hostname;
    const hasDomain = /https?:\/\/[^\s/$.?#].[^\s]*$/i.test(url);

    if (hasDomain || hostname === 'localhost') {
        return url;
    }

    return url.toString();
};

const handleUnauthorizedError = (error) => {
    if (error.response && error.response.status === 401) {
        const returnTo = window.location.pathname;
        const message = error.response.data.message;
        const type = error.response.data.type || 0;
        const reason = error.response.data.reason;

        const queryParams = [];
        if (returnTo) {
            queryParams.push(`return_to=${encodeURIComponent(returnTo)}`);
        }
        if (message) {
            queryParams.push(`message=${encodeURIComponent(message)}`);
        }
        if (type) {
            queryParams.push(`type=${encodeURIComponent(type)}`);
        }
        if (reason) {
            queryParams.push(`reason=${encodeURIComponent(reason)}`);
        }

        Cookies.remove('token'); // Xóa cookie 'access_token'

        window.location.href = '/administrators/login?' + queryParams.join('&');
    } else {
        throw error;
    }
};

// Export các hàm HTTP
export default {
    post: (url, data, config) => {
        url = fixUrl(url);
        return instance.post(url, data, config).catch(handleUnauthorizedError);
    },

    get: (url, config) => {
        url = fixUrl(url);
        return instance.get(url, config).catch(handleUnauthorizedError);
    },

    put: (url, data, config) => {
        url = fixUrl(url);
        return instance.put(url, data, config).catch(handleUnauthorizedError);
    },

    delete: (url, config) => {
        url = fixUrl(url);
        return instance.delete(url, config).catch(handleUnauthorizedError);
    },
};