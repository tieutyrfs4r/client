import { createApp } from 'vue';
import NotifyComponent from '../vue/NotifyComponent.vue';

const NotifyApp = createApp(NotifyComponent);
const notifyContainer = document.createElement('div');
document.body.appendChild(notifyContainer);
const notifyInstance = NotifyApp.mount(notifyContainer);

const Notify = {
    success(title, message,limit_time = 5000) {
        notifyInstance.showNotify('success', title, message,limit_time);
    },
    error(title, message,limit_time = 5000) {
        notifyInstance.showNotify('error', title, message,limit_time);
    }
};


export default Notify;
