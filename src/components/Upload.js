import React, {useEffect, useState} from 'react';
import Dropzone from 'react-dropzone';

const Upload = () => {
  const Preview = ({ meta }) => {
    const { name, percent, status } = meta
    return (
      <span style={{ alignSelf: 'flex-start', margin: '10px 3%', fontFamily: 'Helvetica' }}>
        {name}, {Math.round(percent)}%, {status}
      </span>
    )
  }

  return(
    <div className="App">
      <div class ="row row-header">
        <div class="col-sm-1">
          <img alt="" class="img-responsive" src="assets/images/pro1.png" width = "50%"  ></img>
        </div>
        <div class="col-sm-2"> <a href='/index.html'  class='title-font' title='Home'>home</a>
        </div>
        <div class="col-sm-2"> <a href='/index.html' class='title-font' title='List'>group</a>
        </div>
        <div class="col-sm-2"> <a href='/user.html' class='title-font' title='List'>user</a>
        </div>
        <div class="col-sm-2"> <a href='/upload.html' class='title-font' title='List'>list</a>
        </div>
        <div class="col-sm-3"> <a href='/setting.html' class='title-font' title='List'>setting</a>
        </div>
      </div>

      <Dropzone onDrop={acceptedFiles => console.log(acceptedFiles)} PreviewComponent={Preview}>
        {({getRootProps, getInputProps}) => (
          <section>
            <div {...getRootProps()}>
              <input {...getInputProps()} />
              <div className="uploadBox">Click to upload file</div>
            </div>
          </section>
        )}
      </Dropzone>

      <div class ="footer fixed-bottom">
        this is footer 
      </div>
    </div>
  )
}

export default Upload;