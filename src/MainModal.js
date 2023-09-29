import { Box, Button, Grid, Typography } from "@mui/material";
import React, { useState } from "react";
import { Dialog } from "@mui/material";
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import { Pause } from '@mui/icons-material';
import PanToolIcon from '@mui/icons-material/PanTool';
import VolumeOffIcon from '@mui/icons-material/VolumeOff';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import MicIcon from '@mui/icons-material/Mic';
import MicOffIcon from '@mui/icons-material/MicOff';

const MainModal = ({ fetchMainStream,onClose }) => {

    const [open, setOpen] = useState(true);
    const handleClose = () => {
        onClose();
        fetchMainStream();
        setOpen(false)
    }
    return (

        <Dialog open={open} PaperProps={{
            style: {
                // width: '60%',
                maxHeight: '90%',
                margin: "10px",
                // overflow: "scroll"
            }
        }} className="aaaaaaaaaaa">
            <Box sx={{ padding: "20px" }}>
                <Grid container>
                    <Grid item xs={12} sm={12} md={12} lg={12} sx={{ display: "flex", justifyContent: "center", textAlign: "center" }}>
                        <Box sx={{ marginLeft: "1rem", display: "block", textAlign: "center" }}>
                            <Box sx={{ display: "flex", margin: "10px" }}>
                                <PlayArrowIcon color="action" /> &nbsp; &nbsp; - &nbsp; &nbsp;<Typography><b>Play</b></Typography>
                            </Box>
                            <Box sx={{ display: "flex", margin: "10px" }}>
                                <Pause color="action" />&nbsp; &nbsp; - &nbsp; &nbsp;<Typography><b>Pause</b></Typography>
                            </Box>
                            <Box sx={{ display: "flex", margin: "10px" }}>
                                <PanToolIcon color="action" />&nbsp; &nbsp; - &nbsp; &nbsp;<Typography><b>Press to Raise Hand</b></Typography>
                            </Box>
                            <Box sx={{ display: "flex", margin: "10px" }}>
                                <PanToolIcon sx={{ color: "green" }} />&nbsp; &nbsp; - &nbsp; &nbsp;<Typography><b>Raised Hand</b></Typography>
                            </Box>
                            <Box sx={{ display: "flex", margin: "10px" }}>
                                <VolumeUpIcon color="action" />&nbsp; &nbsp; - &nbsp; &nbsp;<Typography><b>Volume On</b></Typography>
                            </Box>
                            <Box sx={{ display: "flex", margin: "10px" }}>
                                <VolumeOffIcon color="action" />&nbsp; &nbsp; - &nbsp; &nbsp;<Typography><b>Volume Off</b></Typography>
                            </Box>
                            <Box sx={{ display: "flex", margin: "10px" }}>
                                <MicIcon color="action" />&nbsp; &nbsp; - &nbsp; &nbsp;<Typography><b>Turn on Mic</b></Typography>
                            </Box>
                            <Box sx={{ display: "flex", margin: "10px" }}>
                                <MicOffIcon color="action" />&nbsp; &nbsp; - &nbsp; &nbsp;<Typography><b>Turn off Mic</b></Typography>
                            </Box>
                            <Button
                                variant="text"
                                // sx={{ marginLeft: "3em", float: "left" }}
                                onClick={handleClose}
                                color="primary"
                            >
                                Okay
                            </Button>
                        </Box>

                    </Grid>
                </Grid>

            </Box>
        </Dialog>

    )
};

export default MainModal;
