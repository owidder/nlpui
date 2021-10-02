// see: https://observablehq.com/@sinamoeini/distinguishing-click-and-double-click-in-d3-v6
import * as d3 from "d3";

type coord = [number, number];

// euclidean distance
const dist = (a: coord, b: coord) => {
    return Math.sqrt(Math.pow(a[0] - b[0], 2) + Math.pow(a[1] - b[1], 2));
}

// Method is assumed to be a standard D3 getter-setter:
// If passed with no arguments, gets the value.
// If passed with arguments, sets the value and returns the target.
const rebindMethod = (target, source, method) => {
    return (...args) => {
        const value = method.apply(source, args);
        return value === source ? target : value;
    };
}

// Copies a variable number of methods from source to target.
const rebind = (target, source, ...methods) => {
    for (let method of methods) {
        target[method] = rebindMethod(target, source, source[method]);
    }
    return target;
}

// see: http://bl.ocks.org/ropeladder/83915942ac42f17c087a82001418f2ee
//      based on: http://bl.ocks.org/couchand/6394506
export const cancelableClick =  ({tolerance = 5, timeout = 200} = {}) => {
    const dispatcher = d3.dispatch('click', 'dblclick');

    const cc = (selection) => {
        let downPt;
        let lastTs;
        let waitId;
        let eventArgs;

        selection.on('mousedown', (event, ...args) => {
            downPt = d3.pointer(event, document.body);
            lastTs = Date.now();
            eventArgs = [event, ...args];
        });

        selection.on('click', (e) => {
            if (dist(downPt, d3.pointer(e, document.body)) >= tolerance) {
                return;
            }

            if (waitId) {
                window.clearTimeout(waitId);
                waitId = null;
                dispatcher.apply("dblclick", selection, eventArgs);
            } else {
                waitId = window.setTimeout(
                    () => {
                        dispatcher.apply("click", selection, eventArgs);
                        waitId = null;
                    },
                    timeout
                );
            }
        });
    };

    return rebind(cc, dispatcher, 'on');
}
