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
    viewAll: string;
    success: string;
    error: string;
    submit: string;
    close: string;
    actions: string;
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
  workspace: {
    title: string;
    createProject: string;
    createOutline: string;
    createManuscript: string;
    stats: {
      todayWords: string;
      weekWords: string;
      totalWords: string;
      projectCount: string;
      manuscriptCount: string;
    };
    recent: {
      projects: string;
      outlines: string;
      manuscripts: string;
    };
    empty: {
      projects: string;
      outlines: string;
      manuscripts: string;
    };
    status: {
      draft: string;
      inProgress: string;
      completed: string;
      published: string;
      generating: string;
      generated: string;
    };
    wordCount: string;
  };
  manuscripts: {
    title: string;
    create: string;
    edit: string;
    delete: string;
    createFromOutline: string;
    name: string;
    type: string;
    status: string;
    words: string;
    volumes: string;
    chapters: string;
    lastEdited: string;
    ai: {
      continue: string;
      polish: string;
      expand: string;
      generating: string;
    };
    editor: {
      title: string;
      autoSave: string;
      saveSuccess: string;
      saveFailed: string;
    };
    chapter: {
      add: string;
      edit: string;
      delete: string;
      publish: string;
      unpublish: string;
      content: string;
    };
    version: {
      history: string;
      restore: string;
      current: string;
    };
  };
  outline: {
    title: string;
    create: string;
    edit: string;
    delete: string;
    name: string;
    type: string;
    status: string;
    generate: string;
    generating: string;
    saveContent: string;
    volumes: string;
    chapters: string;
    addVolume: string;
    addChapter: string;
    volumeName: string;
    chapterName: string;
    content: string;
  };
  settings: {
    title: string;
    project: {
      title: string;
      create: string;
      edit: string;
      delete: string;
      name: string;
      type: string;
      description: string;
    };
    character: {
      title: string;
      create: string;
      edit: string;
      delete: string;
      name: string;
      description: string;
      content: string;
    };
    world: {
      title: string;
      create: string;
      edit: string;
      delete: string;
      name: string;
      description: string;
      content: string;
    };
    system: {
      title: string;
      create: string;
      edit: string;
      delete: string;
      name: string;
      description: string;
      content: string;
    };
    misc: {
      title: string;
      create: string;
      edit: string;
      delete: string;
      name: string;
      description: string;
      content: string;
    };
    library: {
      title: string;
      search: string;
      filter: string;
      type: string;
    };
  };
  dictionary: {
    title: string;
    category: {
      title: string;
      create: string;
      edit: string;
      delete: string;
      name: string;
      description: string;
    };
    item: {
      title: string;
      create: string;
      edit: string;
      delete: string;
      term: string;
      definition: string;
      example: string;
    };
  };
  search: {
    title: string;
    placeholder: string;
    results: string;
    noResults: string;
    mention: {
      title: string;
      search: string;
      insert: string;
    };
    backlinks: {
      title: string;
      empty: string;
    };
  };
  export: {
    title: string;
    format: string;
    txt: string;
    markdown: string;
    epub: string;
    docx: string;
    export: string;
    exporting: string;
    success: string;
    failed: string;
  };
  errors: {
    network: string;
    server: string;
    notFound: string;
    unauthorized: string;
    forbidden: string;
    validation: string;
    unknown: string;
  };
  validation: {
    required: string;
    email: string;
    minLength: string;
    maxLength: string;
    pattern: string;
    unique: string;
  };
}
