import Vue from 'vue';
import App from './App.vue';
import router from './router';
import store from './store';
import ElementUI from 'element-ui';
import 'element-ui/lib/theme-chalk/index.css';

// import webSee from "../../packages/core/src";
// import performance from "../../packages/performance/src";
// import recordscreen from "../../packages/recordscreen/src";

import webSee from '../../packages/core/dist/index.esm';
import performance from '../../packages/performance/dist/index.esm';
import recordscreen from '../../packages/recordscreen/dist/index.esm';

Vue.use(webSee, {
  dsn: 'http://localhost:8080/reportData',
  apiKey: 'abcd',
  silentWhiteScreen: true,
  skeletonProject: true,
  repeatCodeError: true,
  userId: '123',
  handleHttpStatus(data) {
    console.log('data', data);
    let { url, response } = data;
    // code为200，接口正常，反之亦然
    let { code } = typeof response === 'string' ? JSON.parse(response) : response;
    if (url.includes('/getErrorList')) {
      return code === 200 ? true : false;
    } else {
      return true;
    }
  },
});
webSee.use(performance);
webSee.use(recordscreen, { recordScreentime: 15 });

Vue.use(ElementUI, { size: 'mini' });
Vue.config.productionTip = false;

setTimeout(() => {
  new Vue({
    router,
    store,
    render: h => h(App),
  }).$mount('#app');
}, 2000);
