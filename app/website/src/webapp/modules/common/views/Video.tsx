import { Grid } from '@material-ui/core';
import { VideoHTMLAttributes, useEffect, useRef, useCallback } from 'react'

declare global {
  interface IProps {
    srcObject?: MediaStream;
    autoPlay?: boolean;
  }
}

export function Video({ srcObject, autoPlay = false }: VideoHTMLAttributes<HTMLVideoElement> & IProps): JSX.Element {
  const refVideo = useCallback((node: HTMLVideoElement) => {
    if (node && srcObject) node.srcObject = srcObject;
  }, [srcObject])

  return <>
    <Grid container direction="column" alignItems='center'>
      <Grid item xs={12}>
        <video controls autoPlay ref={refVideo} />
      </Grid>
    </Grid>
  </>
}

export default Video;