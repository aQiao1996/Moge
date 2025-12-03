/**
 * 翻译消息类型定义
 */

import type { AbstractIntlMessages } from 'next-intl';

export interface Messages extends AbstractIntlMessages {
  common: {
    save: string;
    cancel: string;
    delete: string;
    edit: string;
    create: string;
    confirm: string;
    back: string;
    loading: string;
    noData: string;
    search: string;
    filter: string;
    sort: string;
    export: string;
    import: string;
  };
  nav: {
    workspace: string;
    manuscripts: string;
    outline: string;
    settings: string;
    dictionary: string;
    profile: string;
  };
  auth: {
    login: string;
    logout: string;
    register: string;
    email: string;
    password: string;
    username: string;
  };
}
