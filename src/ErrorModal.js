import { Box } from "@mui/material";
import React, { useState } from "react";
import { Dialog } from "@mui/material";

const ErrorModal = () => {

    const [open, setOpen] = useState(true);
    return (

        <Dialog open={open} sx={{backgroundColor: "black"}} PaperProps={{
            style: {
                width: '60%',
                maxHeight: '100%',
            }
        }}>
            <Box sx={{ padding: "5px", textAlign: "center" }}>
            <h1>Unauthorized User </h1>
            </Box>
        </Dialog>

    )
};

export default ErrorModal;