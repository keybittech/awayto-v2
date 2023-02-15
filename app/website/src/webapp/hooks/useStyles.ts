import { Theme, ThemeOptions } from '@mui/material/styles/createTheme';

import makeStyles from '@mui/styles/makeStyles';

import green from '@mui/material/colors/green';
import red from '@mui/material/colors/red';
import { PaletteMode } from 'awayto';


const drawerWidth = 175;

/**
 * @category Style
 */
export const useStyles = makeStyles(({ mixins, spacing }: Theme) => ({

  appLogo: { width: '64px' },
  logo: { width: '64px' },

  root: { display: 'flex' },

  backdrop: { zIndex: 99999, color: '#fff', },

  siteTitle: { fontSize: '1.5rem', fontFamily: 'roboto', textAlign: 'center' },

  menuText: { fontSize: '.75rem', margin: '0' },

  colorBox: { width: '30px', height: '30px', display: 'block', margin: '12px', border: '1px solid #333', cursor: 'pointer', '&:hover': { opacity: .5 } },

  appBar: { width: `calc(100% - ${drawerWidth}px)`, marginLeft: drawerWidth, backgroundColor: '#666' },
  drawer: { width: drawerWidth },
  drawerPaper: {
    width: drawerWidth,
    // backgroundColor: '#121f31',
  },
  // necessary for content to be below app bar
  toolbar: mixins.toolbar,
  content: { flexGrow: 1, padding: spacing(3) },

  menuIcon: { "&:hover svg": { color: 'rgb(39 109 129)' }, width: '100%' },

  loginWrap: { height: '75vh' },

  link: {
    textDecoration: 'none'
  },

  dropzone: { width: '400px', height: '150px' },

  datatable: { borderRadius: '4px' },

  //Common
  infoHeader: { fontWeight: 500, fontSize: '1rem', textTransform: 'uppercase', color: '#aaa !important' },
  infoLabel: { fontWeight: 500, fontSize: '1rem' },
  infoCard: { height: '200px', overflowY: 'auto' },


  green: { color: green[500] },
  red: { color: red[500] },

  audioButton: { cursor: 'pointer' },

  overflowEllipsis: { textOverflow: 'ellipsis', whiteSpace: 'nowrap', overflow: 'hidden' },

  blueChecked: { '& .MuiSvgIcon-root': { color: 'lightblue' } },

  chipRoot: { margin: spacing(1), height: '100%', display: 'flex', flexDirection: 'row' },

  chipLabel: { overflowWrap: 'break-word', whiteSpace: 'normal', textOverflow: 'clip' }

}));

export const getBaseComponents: () => ThemeOptions = () => ({
  components: {
    MuiDrawer: {
      styleOverrides: {
        paper: {
          '& .MuiList-padding': {
            paddingLeft: 'unset'
          },
          '& .MuiListItem-button': {
            paddingLeft: '16px'
          }
        }
      }
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          padding: '4px 8px !important'
        }
      }
    },
    MuiTableBody: {
      styleOverrides: {
        root: {
          '& .MuiTableCell-body:not(:last-child)': {
            '&:not(:last-child)': {
              borderRight: '1px solid rgb(228, 228, 228)',
            }
          },
          '& .MuiIconButton-root': {
            padding: 0
          },
          '& .MuiButton-textSizeSmall': {
            padding: '0 4px'
          }
        }
      }
    },
    MuiSlider: {
      styleOverrides: {
        root: {
          padding: '4px 0'
        }
      }
    },
    MuiList: {
      styleOverrides: {
        root: {
          listStyleType: 'disc',
          marginTop: 24,
          marginBottom: 24
        },
        padding: {
          paddingTop: 0,
          paddingRight: 0,
          paddingBottom: 0,
          paddingLeft: 16,
        }
      }
    },
    MuiListItem: {
      styleOverrides: {
        root: {
          '&.bullet': {
            display: 'list-Item'
          }
        },
        gutters: {
          paddingLeft: 0,
          paddingRight: 0,
        }
      }
    },
    MuiTypography: {
      styleOverrides: {
        root: {
          marginTop: 12,
          marginBottom: 12,
        }
      }
    },
  }
});

/**
 * @category Style
 */
export const lightTheme: ThemeOptions = {
  palette: {
    mode: 'light',
    primary: {
      main: '#000',
      dark: '#aaa',
      contrastText: '#333'
    }
  }
};

/**
 * @category Style
 */
export const darkTheme: ThemeOptions = {
  palette: {
    mode: 'dark',
  },
  components: {

  }
};

export const getDesignTokens: (mode: PaletteMode) => ThemeOptions = (mode) => ({
  palette: {
    mode,
    ...(
      mode === 'light' ? {
        // palette values for light mode
        primary: {
          main: '#000',
          dark: '#aaa',
          contrastText: '#333'
        }
      }
      : mode === 'dark' ? {
        // palette values for dark mode
        primary: {
          main: '#fff',
          contrastText: '#333'
        },
        secondary: { main: '#009cc8' }
      }
      : {
        // palette for blue
        primary: {
          main: '#000',
          dark: '#121f31'
        },
        secondary: { main: 'rgb(0 191 255)' }
      })
  },
});

export const getThemedComponents: (mode: PaletteMode) => ThemeOptions = (mode) => ({
  components: {
    ...(
      mode === 'light' ? {
        // Light theme components
      } : mode === 'dark' ? {
        // Dark theme components
        MuiInput: {
          styleOverrides: {
            underline: {
              '&:before': {
                borderBottom: '1px solid #333'
              }
            }
          }
        }
      } : {
        // Blue theme components
        MuiDrawer: {
          styleOverrides: {
            paper: {
              backgroundColor: '#009cc8'
            },
            root: {
              '& .MuiTypography-root': {
                color: '#fff'
              },
              '& .MuiSvgIcon-colorPrimary': {
                color: '#fff'
              },
              '& .MuiSvgIcon-colorSecondary': {
                color: '#121f31'
              }
            }
          }
        },
        MuiInput: {
          styleOverrides: {
            underline: {
              '&:before': {
                borderBottom: '1px solid #aaa'
              },
              '&:hover:not(.Mui-disabled):before': {
                borderBottom: '2px solid rgb(0 191 255)'
              },
              '&.Mui-focused:after': {
                borderBottom: '2px solid rgb(39 109 129)'
              }
            }
          }
        }
      }
      
    )
  }
})
