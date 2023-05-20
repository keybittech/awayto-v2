import React, { useEffect, useRef, useState } from 'react';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import Tooltip from '@mui/material/Tooltip';
import IconButton from '@mui/material/IconButton';
import TextField from '@mui/material/TextField';
import ListSubheader from '@mui/material/ListSubheader';

import EditIcon from '@mui/icons-material/Edit';
import BrushIcon from '@mui/icons-material/Brush';
import LayersClearIcon from '@mui/icons-material/LayersClear';
import PanToolIcon from '@mui/icons-material/PanTool';
import ZoomInIcon from '@mui/icons-material/ZoomIn';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import SettingsIcon from '@mui/icons-material/Settings';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import KeyboardArrowLeftIcon from '@mui/icons-material/KeyboardArrowLeft';
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight';
import KeyboardDoubleArrowLeftIcon from '@mui/icons-material/KeyboardDoubleArrowLeft';
import KeyboardDoubleArrowRightIcon from '@mui/icons-material/KeyboardDoubleArrowRight';

import { useDebounce, useStyles } from 'awayto/hooks';
import { Whiteboard, throttle } from 'awayto/core';
import type { PopoverOrigin } from '@mui/material';

type WhiteBoardOptionsFns = { [props: string]: (...props: unknown[]) => void };
const scales = [.1, .25, .5, .8, 1, 1.25, 1.5, 2, 2.5, 3, 4];
const directions = {
  tl: {
    background: 'conic-gradient(transparent 0deg 270deg, lightblue 270deg 360deg)',
    anchor: { vertical: 'bottom', horizontal: 'left' },
    transform: { vertical: 'top', horizontal: 'left' },
    position: { top: 25, left: 25 }
  },
  tr: {
    background: 'conic-gradient(lightblue 0deg 90deg, transparent 90deg 270deg)',
    anchor: { vertical: 'bottom', horizontal: 'right' },
    transform: { vertical: 'top', horizontal: 'right' },
    position: { top: 25, right: 25 }
  },
  bl: {
    background: 'conic-gradient(transparent 0deg 180deg, lightblue 180deg 270deg, transparent 270deg 360deg)',
    anchor: { vertical: 'top', horizontal: 'left' },
    transform: { vertical: 'bottom', horizontal: 'left' },
    position: { bottom: 25, left: 25 }
  },
  br: {
    background: 'conic-gradient(transparent 0deg 90deg, lightblue 90deg 180deg, transparent 180deg 360deg)',
    anchor: { vertical: 'top', horizontal: 'right' },
    transform: { vertical: 'bottom', horizontal: 'right' },
    position: { bottom: 25, right: 25 }
  }
};

declare global {
  interface IProps {
    whiteboard?: Whiteboard;
    whiteboardRef?: HTMLCanvasElement;
    contextRef?: CanvasRenderingContext2D;
    canvasPointerEvents?: string;
    strokeColor?: string;
    numPages?: number;
    pageNumber?: number;
    scale?: number;
  }
}


export function WhiteboardOptionsMenu({
  children,
  contextRef,
  whiteboardRef,
  whiteboard,
  strokeColor,
  setStrokeColor,
  pageNumber,
  numPages,
  scale,
  canvasPointerEvents,
  setCanvasPointerEvents,
  sendWhiteboardMessage,
}: Required<IProps> & WhiteBoardOptionsFns): React.JSX.Element {

  const panning = 'none' === canvasPointerEvents;
  const penning = !whiteboard.settings.highlight;

  const classes = useStyles();

  const [whiteboardOptionsAnchorEl, setWhiteboardOptionsAnchorEl] = useState<null | HTMLElement>(null);
  const isWhiteboardOptionsOpen = Boolean(whiteboardOptionsAnchorEl);
  const whiteboardOptionsMenuId = 'whiteboard-options-menu';

  const repositoningRef = useRef<HTMLDivElement | null>(null);
  const [dir, setDir] = useState<keyof typeof directions>('tl');

  const handleMenuClose = () => {
    setWhiteboardOptionsAnchorEl(null);
  };

  const setDrawStyle = (hl: boolean) => {
    whiteboard.settings.highlight = hl;
    sendWhiteboardMessage('change-setting', { settings: { highlight: hl } });
    setPointerEvents('auto');
  };

  const setPointerEvents = (style: string) => {
    setCanvasPointerEvents(style);
    handleMenuClose();
  }

  const setScale = (inc: boolean | number) => {
    const scale = whiteboard.settings.scale || 1;
    const nextScale = 'number' === typeof inc ?
      inc :
      inc ? scales[Math.min(scales.indexOf(scale) + 1, scales.length)] : (scales[(scales.indexOf(scale) - 1 || 0)]);
    if (nextScale > 0 && nextScale <= 4) {
      sendWhiteboardMessage('set-scale', { settings: { scale: nextScale } });
    }
  };

  const setPage = (next: boolean | number) => {
    let page = pageNumber || 1;
    next ? page++ : page--;
    const nextPage = 'number' === typeof next ?
      Math.min(next, numPages) :
      next ? Math.min(page, numPages) : (page || 1);
    sendWhiteboardMessage('set-page', { settings: { page: Math.max(1, nextPage) } });
  };

  const debouncedStroke = useDebounce(strokeColor, 1000);

  useEffect(() => {
    sendWhiteboardMessage('set-stroke', { settings: { stroke: debouncedStroke } });
    whiteboard.settings.stroke = debouncedStroke;
  }, [debouncedStroke]);

  return <Box sx={{ position: 'absolute', zIndex: 100, ...directions[dir].position }}>

    <Button
      className={classes.darkRounded}
      endIcon={<Tooltip title="Board Options" children={<ArrowDropDownIcon fontSize="small" />} />}
      onClick={e => setWhiteboardOptionsAnchorEl(e.currentTarget)}
    >
      <Tooltip title="Reposition" children={
        <IconButton
          component="div"
          ref={repositoningRef}
          sx={{ background: directions[dir].background }}
          onMouseDown={e => {
            if (repositoningRef.current) {
              const repositoningHalfHeight = Math.ceil(repositoningRef.current.offsetHeight / 2);
              const repositoningHalfWidth = Math.ceil(repositoningRef.current.offsetWidth / 2);
              setDir(() => {
                if ((e.nativeEvent.offsetX + 8) <= repositoningHalfWidth) {
                  return (e.nativeEvent.offsetY + 8) <= repositoningHalfHeight ? 'tl' : 'bl';
                } else {
                  return (e.nativeEvent.offsetY + 8) <= repositoningHalfHeight ? 'tr' : 'br';
                }
              })
            }
          }}
        >
          <SettingsIcon fontSize="small" />
        </IconButton>
      } />

    </Button>

    <Menu
      keepMounted
      id={whiteboardOptionsMenuId}
      anchorEl={whiteboardOptionsAnchorEl}
      anchorOrigin={directions[dir].anchor as PopoverOrigin}
      transformOrigin={directions[dir].transform as PopoverOrigin}
      open={!!isWhiteboardOptionsOpen}
      onClose={handleMenuClose}
    >
      <Box sx={{ width: 320 }}>

        {numPages > 0 && <List
          disablePadding
          subheader={
            <ListSubheader>Document</ListSubheader>
          }
        >
          <ListItem>
            <TextField
              select
              fullWidth
              label="Zoom"
              variant="standard"
              value={scale}
              onChange={e => setScale(parseFloat(e.target.value))}
              InputProps={{
                startAdornment: <ZoomInIcon sx={{ mr: 1 }} />
              }}
            >
              {scales.map(v => <MenuItem key={v} value={v}>{Math.round(parseFloat(v.toFixed(2)) * 100)}%</MenuItem>)}
            </TextField>

            <Box sx={{ minWidth: '72px', alignSelf: 'flex-end' }} className={classes.darkRounded}>
              <Tooltip title="Zoom Out" children={
                <IconButton onClick={() => setScale(false)}>
                  <RemoveIcon fontSize="small" />
                </IconButton>
              } />
              <Tooltip title="Zoom In" children={
                <IconButton onClick={() => setScale(true)}>
                  <AddIcon fontSize="small" />
                </IconButton>
              } />
            </Box>
          </ListItem>

          <ListItem>
            <TextField
              fullWidth
              label="Page"
              type="number"
              variant="standard"
              value={pageNumber}
              onChange={e => setPage(parseInt(e.target.value))}
              InputProps={{
                startAdornment: <MenuBookIcon sx={{ mr: 1 }} />,
                endAdornment: <Box sx={{ minWidth: 60 }}>of {numPages}</Box>
              }}
            />

            <Box sx={{ minWidth: '144px', alignSelf: 'flex-end' }} className={classes.darkRounded}>
              <Tooltip title="First Page" children={
                <IconButton onClick={() => setPage(1)}>
                  <KeyboardDoubleArrowLeftIcon fontSize="small" />
                </IconButton>
              } />
              <Tooltip title="Previous Page" children={
                <IconButton onClick={() => setPage(false)}>
                  <KeyboardArrowLeftIcon fontSize="small" />
                </IconButton>
              } />
              <Tooltip title="Next Page" children={
                <IconButton onClick={() => setPage(true)}>
                  <KeyboardArrowRightIcon fontSize="small" />
                </IconButton>
              } />
              <Tooltip title="Last Page" children={
                <IconButton onClick={() => setPage(numPages)}>
                  <KeyboardDoubleArrowRightIcon fontSize="small" />
                </IconButton>
              } />
            </Box>
          </ListItem>
        </List>}

        <List
          disablePadding
          subheader={
            <ListSubheader>Canvas</ListSubheader>
          }
        >

          <ListItem
            secondaryAction={
              <Tooltip title="Clear Canvas">
                <IconButton
                  color="error"
                  onClick={() => {
                    contextRef?.clearRect(0, 0, whiteboardRef.width || 0, whiteboardRef.height || 0);
                    handleMenuClose();
                  }}
                  children={<LayersClearIcon />}
                />
              </Tooltip>
            }
          >
            <Tooltip title="Pan">
              <IconButton onClick={() => setPointerEvents('none')} >
                <PanToolIcon color={panning ? 'info' : 'primary'} />
              </IconButton>
            </Tooltip>

            <Tooltip title="Pen">
              <IconButton onClick={() => setDrawStyle(false)} >
                <EditIcon color={!panning && penning ? 'info' : 'primary'} />
              </IconButton>
            </Tooltip>

            <Tooltip title="Brush">
              <IconButton onClick={() => setDrawStyle(true)} >
                <BrushIcon color={!panning && !penning ? 'info' : 'primary'} />
              </IconButton>
            </Tooltip>

            <Tooltip title="Select Color">
              <IconButton onClick={console.log}>
                <Box
                  sx={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '24px',
                    overflow: 'hidden'
                  }}
                >
                  <Box
                    sx={{
                      border: 'none',
                      width: '200%',
                      height: '200%',
                      cursor: 'pointer',
                      transform: 'translate(-25%, -25%)'
                    }}
                    component="input"
                    type="color"
                    value={strokeColor}
                    onChange={e => setStrokeColor(e.target.value)}
                  />
                </Box>
              </IconButton>
            </Tooltip>

          </ListItem>

        </List>

        {children}
      </Box>
    </Menu>
  </Box>;

}

export default WhiteboardOptionsMenu;