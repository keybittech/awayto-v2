import type { } from '@mui/x-date-pickers/themeAugmentation';
import { Theme, ThemeOptions } from '@mui/material/styles/createTheme';

import makeStyles from '@mui/styles/makeStyles';

import deepmerge from '@mui/utils/deepmerge';
import createTheme from '@mui/material/styles/createTheme';
import green from '@mui/material/colors/green';
import red from '@mui/material/colors/red';
import { PaletteMode } from 'awayto/core';
import { StyleRules } from '@mui/styles';


const drawerWidth = 175;

/**
 * @category Style
 */
export const useStyles = makeStyles((theme: Theme) => {

  const absoluteFullChild = {
    position: 'absolute',
    width: '100%',
    height: '100%'
  };

  return {

    appLogo: { width: '64px' },
    logo: { width: '64px' },

    root: { display: 'flex' },

    siteTitle: { fontSize: '1.5rem', textAlign: 'center' },

    menuText: { fontSize: '.75rem' },

    colorBox: { width: '30px', height: '30px', display: 'block', margin: '12px', border: '1px solid #333', cursor: 'pointer', '&:hover': { opacity: .5 } },

    appBar: { width: `calc(100% - ${drawerWidth}px)`, marginLeft: drawerWidth, backgroundColor: '#666' },

    menuIcon: { "&:hover svg": { color: 'rgb(39 109 129)' } },

    loginWrap: { height: '75vh' },

    link: { textDecoration: 'none' },

    dropzone: { width: '400px', height: '150px' },

    datatable: { borderRadius: '4px' },

    infoHeader: { fontWeight: 500, fontSize: '1rem', textTransform: 'uppercase', color: '#aaa !important' },
    infoLabel: { fontWeight: 500, fontSize: '1rem' },
    infoCard: { height: '200px', overflowY: 'auto' },

    darkRounded: {
      borderRadius: '16px',
      backgroundColor: '#203040',
      '& *': { color: 'white' },
      '&.MuiButton-root:hover': {
        backgroundColor: '#606060'
      }
    },
    green: { color: green[500] },
    red: { color: red[500] },

    audioButton: { cursor: 'pointer' },

    overflowEllipsis: { textOverflow: 'ellipsis', whiteSpace: 'nowrap', overflow: 'hidden' },

    blueChecked: { '& .MuiSvgIcon-root': { color: 'lightblue' } },

    chipRoot: { margin: theme.spacing(1), height: '100%', display: 'flex', flexDirection: 'row' },

    chipLabel: { overflowWrap: 'break-word', whiteSpace: 'normal', textOverflow: 'clip' },


    pdfViewerComps: {
      ...absoluteFullChild,
      display: 'flex',
      placeContent: 'center',
      placeItems: 'center',
      '& *': {
        maxWidth: '100%',
        maxHeight: '100%',
      }
    },

    whiteboardActionButton: {
      position: 'absolute',
      zIndex: 11,
      backgroundColor: '#eee',
      right: 35
      // [theme.breakpoints.down('sm')]: {
      //   ,
      // },
      // [theme.breakpoints.up('md')]: {
      //   right: -50
      // },
    },

    variableButtonIcon: {
      [theme.breakpoints.down('sm')]: {
        fontSize: '24px',
      },
      [theme.breakpoints.up('md')]: {
        // marginTop: '-4px',
        fontSize: '12px !important',
      },
    },

    mdHide: {
      [theme.breakpoints.down('md')]: {
        display: 'flex',
      },
      [theme.breakpoints.up('md')]: {
        display: 'none'
      },
    },

    mdShow: {
      [theme.breakpoints.down('md')]: {
        display: 'none',
      },
      [theme.breakpoints.up('md')]: {
        display: 'flex'
      },
    }


  } as StyleRules;
});

export const getBaseComponents: () => ThemeOptions = () => ({
  components: {
    MuiPickersDay: {
      styleOverrides: {
        root: {
          '&:not(.Mui-disabled)': {
            backgroundColor: 'rgb(64 64 64)',
            color: 'rgb(100 150 200)'
          },
          '&.Mui-selected': {
            backgroundColor: 'rgb(128 128 128) !important'
          },
          '&:hover': {
            backgroundColor: '#aaa'
          }
        }
      }
    },
    MuiClockPointer: {
      styleOverrides: {
        thumb: {
          backgroundColor: 'inherit'
        }
      }
    },
    MuiClockNumber: {
      styleOverrides: {
        root: {
          '&:not(.Mui-disabled)': {
            color: 'rgb(100 150 200)'
          }
        }
      }
    },
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
    MuiButton: {
      styleOverrides: {
        root: {
          marginBottom: '4px',
          padding: '6px 8px 4px',
          alignItems: 'baseline'
        }
      }
    },
    MuiDialog: {
      styleOverrides: {
        container: {
          '.MuiCard-root': {
            overflowY: 'scroll'
          }
        }
      }
    }
  }
});

export const getDesignTokens: (mode: PaletteMode) => ThemeOptions = (mode) => ({
  // typography: {
  //   fontFamily: ['Roboto', 'sans-serif'].join(',')
  // },
  palette: {
    mode,
    ...(
      mode === 'light' ? {
        // palette values for light mode
        primary: {
          main: '#121f31',
          dark: '#ddeeff',
          contrastText: '#333'
        },
        secondary: { main: 'rgb(100 150 200)' }
      }
        : mode === 'dark' ? {
          // palette values for dark mode
          primary: {
            main: '#ddd',
            contrastText: '#333',
            dark: '#203040'
          },
          secondary: {
            main: '#009cc8',
            dark: '#1c1d1e'
          }
        }
          : {
            // palette for blue
            primary: {
              main: '#000',
              dark: '#121f31'
            },
            secondary: { main: 'rgb(100 150 200)' }
          })
  },
});

export const getThemedComponents: (mode: PaletteMode) => ThemeOptions = (mode) => ({
  components: {
    ...(
      mode === 'light' ? {
        // Light theme components
        MuiPickersDay: {
          styleOverrides: {
            root: {
              '&.Mui-selected': {
                backgroundColor: '#333 !important'
              }
            }
          }
        },
        MuiClock: {
          styleOverrides: {
            pmButton: {
              color: '#aaa'
            },
            amButton: {
              color: '#aaa'
            }
          }
        },
        MuiClockNumber: {
          styleOverrides: {
            root: {
              '&.Mui-selected': {
                backgroundColor: '#ccc'
              }
            }
          }
        },
        MuiIconButton: {
          styleOverrides: {
            root: {
              color: 'rgb(100 150 200)'
            }
          }
        },
        MuiButton: {
          styleOverrides: {
            root: {
              color: 'rgb(100 150 200)'
            }
          }
        }
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
        },
        MuiIconButton: {
          styleOverrides: {
            root: {
              color: 'rgb(100 150 200)'
            }
          }
        },
        MuiButton: {
          styleOverrides: {
            root: {
              ':not(.MuiButton-*Secondary)': {
                color: 'rgb(100 150 200)'
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
                borderBottom: '2px solid rgb(100 150 200)'
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

const darkTokens = getDesignTokens('dark');
const darkComponents = getThemedComponents('dark');
const darkSite = deepmerge(darkTokens, darkComponents);
export const darkTheme = createTheme(deepmerge(darkSite, getBaseComponents()));

const lightTokens = getDesignTokens('light');
const lightComponents = getThemedComponents('light');
const lightSite = deepmerge(lightTokens, lightComponents);
export const lightTheme = createTheme(deepmerge(lightSite, getBaseComponents()));
