export interface Theme {
  name: string;
  properties: any;
}

export const light: Theme = {
  name: 'light',
  properties: {
    '--color--txt': 'white',
    '--color--bg': 'var(--color--black)',
    '--color--grey3': '#f0f0f0',
    '--color--grey1': '#1b1b1b',
    '--gradient--end': 'var(--color--black)'
  }
};

export const dark: Theme = {
  name: 'dark',
  properties: {
    '--color--txt': 'var(--color--black)',
    '--color--bg': 'white',
    '--color--grey3': '#1b1b1b',
    '--color--grey1': '#f0f0f0',
    '--gradient--end': 'white'
  }
};
