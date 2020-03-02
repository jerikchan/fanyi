'use strict';

const debug = require('debug')('fanyi');
const translation = require('translation.js');
const logger = console;
const fs = require('fs');
const path = require('path');

// 多语言翻译
const translateToOne = ({ text, to, platform = 'google'}) => {
  debug('#translateToOne:: text:%s, to:%s, platform:%s', text, to, platform);
  if (!['google', 'youdao', 'baidu'].includes(platform)) {
    throw new Error('platform not matched');
  }

  return translation[platform].translate({
    text,
    from: 'zh-CN',
    to
  }).then(result => {
    return {
      to,
      result: result.result[0]
    };
  }).catch((err) => {
    logger.error('text:%s translate to language:%s error, code:%s', text, to, err.code);

    return {
      to,
      result: 'locale_err'
    };
  });
};

const translateToAll = ({ toList, text, platform }) => {
  return Promise.all(toList.map(to => {
    return translateToOne({ text, to, platform });
  }));
};

const getDatas = ({ toList, source, platform }) => {
  const sourceKeys = Object.keys(source);

  return Promise.all(sourceKeys.map(key => {
    const text = source[key];
    return translateToAll({ toList, text, platform }).then((list) => {
      return {
        key,
        text,
        list,
      };
    });
  }));
};

const getResult = async ({ toList, source, platform }) => {
  const datas = await getDatas({ toList, source, platform });
  const obj = {};
  toList.forEach(toItem => {
    const target = obj[toItem] = obj[toItem] || {};
    datas.forEach(({ key, list }) => {
      const { result } = list.find(({ to }) => to === toItem);
      target[key] = result;
    });
  });
  return obj;
};

const LANGUAGE_LIST = ['zh-TW', 'en', 'ja', 'lo', 'fr', 'th', 'ko', 'it', 'de', 'ru', 'es'];

const data = {
  slideRight: '向右滑动填充拼图',
  please: '请完成下方验证',
  tooMany: '初始化次数太多，请稍后重试',
  backend: '后端返回后期可能增加的其他情况',
  ifFails: '后端出现故障，切换验证码，根据appKey切换成别的验证码',
  collapses: '拼图崩了，重新初始化',
  retry: '后端出现故障，重试',
  notExisting: '后端出现故障，appKey不在已有的验证码类型',
  notInformed: '后端出现故障，未告知处理方式',
  tryAgain: '服务器出现问题，请稍后重试',
  notCoincide: '滑块和水印不重合，请重试',
  passed: '验证通过',
  tooFast: '手速太快，请重试',
  unknown: '后端返回未知数据',
  sendFailed: '发送验证请求失败，切换验证码',
  confirm: '确定',
  placeholder: '请输入验证码',
  correct: '请输入正确验证码',
};

// translateToOne({ text: '向右滑动填充拼图', to: 'lo', platform: 'google' }).then(result => {
//   console.log(result);
// });

// translateToAll({ toList: LANGUAGE_LIST, text: '向右滑动填充拼图', platform: 'baidu' }).then(result => {
//   console.log(result);
// });

getResult({
  toList: LANGUAGE_LIST,
  source: data,
  platform: 'youdao',
}).then(result => {
  logger.log(JSON.stringify(result));
  fs.writeFileSync(path.join(__dirname, '../fixtures/result.json'), JSON.stringify(result));
});
