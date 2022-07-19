import React, {useEffect} from "react";
import DocItem from "@theme/DocItem";
import {useColorMode} from "@docusaurus/theme-common";
import ExecutionEnvironment from "@docusaurus/ExecutionEnvironment";
import _styles from "./styles.module.css";

export default function PerspectiveDocItem(props) {
    if (ExecutionEnvironment.canUseDOM) {
        const {main} = require("./browser.js");
        const {colorMode} = useColorMode();

        useEffect(() => {
            main(colorMode);
        }, [colorMode]);
    }

    return <DocItem {...props} />;
}
