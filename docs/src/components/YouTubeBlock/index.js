import React from "react";
import clsx from "clsx";

export default (props) => {
    const url = props.url;

    return (
        <div
            className={clsx({
                imageAlignRight: true,
                // imageAlignLeft: !!beforeImage,
                imageAlignSide: true,
            })}
            key={props.title}
        >
            <div className="blockImage col col--4">
                <div className="youtube">
                    <iframe
                        width="500"
                        height="294"
                        src={url}
                        frameBorder="0"
                    ></iframe>
                </div>
            </div>
        </div>
    );
};
