let pts = [];
let dragging = null;
let anim = false;
let t = 0; // time
let speed = 0.02;
let dotsize = 10;

function setup() {
    createCanvas(800, 500);
    pts = [
        createVector(120, 360),
        createVector(620, 360),
        createVector(300, 120)
    ];

    const btn = createButton('play/pause (space)');
    btn.mousePressed(toggleAnimation);
    btn.position(10, 10);

    createP('drag the red points. hit play or spacebar');
}

function toggleAnimation() {
    if (!anim && t >= 1) {
        t = 0;
        return;
    }
    anim = !anim;
    if (anim && t >= 1) {
        t = 0;
    }
}

function draw() {
    background(255);
    // compute base = longest side
    let iA = 0, iB = 1, iC = 2;
    const d01 = p5.Vector.sub(pts[0], pts[1]).magSq();
    const d12 = p5.Vector.sub(pts[1], pts[2]).magSq();
    const d20 = p5.Vector.sub(pts[2], pts[0]).magSq();
    if (d01 >= d12 && d01 >= d20) {
        iA = 0; iB = 1; iC = 2;
    } else if (d12 >= d01 && d12 >= d20) {
        iA = 1; iB = 2; iC = 0;
    } else {
        iA = 2; iB = 0; iC = 1;
    }

    const A = pts[iA].copy();
    const B = pts[iB].copy();
    const C = pts[iC].copy();
    const AB = p5.Vector.sub(B, A);
    const AC = p5.Vector.sub(C, A);
    const H = p5.Vector.add(A, p5.Vector.mult(AB, AB.dot(AC) / AB.magSq()));
    const alt = p5.Vector.sub(C, H);

    const M1 = p5.Vector.add(A, p5.Vector.mult(p5.Vector.sub(C, A), 0.5));
    const M2 = p5.Vector.add(C, p5.Vector.mult(p5.Vector.sub(B, C), 0.5));
    const S1 = lineIntersection(A, B, M1, p5.Vector.add(M1, alt));
    const S2 = lineIntersection(A, B, M2, p5.Vector.add(M2, alt));

    const leftTri = [A.copy(), S1.copy(), M1.copy()];
    const centerPoly = [S1.copy(), M1.copy(), C.copy(), M2.copy(), S2.copy()];
    const rightTri = [B.copy(), S2.copy(), M2.copy()];

    stroke(0);
    strokeWeight(1);
    noFill();
    // original outline
    beginShape();
    vertex(pts[0].x, pts[0].y);
    vertex(pts[1].x, pts[1].y);
    vertex(pts[2].x, pts[2].y);
    endShape(CLOSE);

    stroke(150, 150, 255);
    strokeWeight(2);
    line(C.x, C.y, H.x, H.y);

    stroke(120);
    strokeWeight(1);
    line(M1.x, M1.y, S1.x, S1.y);
    line(M2.x, M2.y, S2.x, S2.y);
    // mid-segment
    line(M1.x, M1.y, M2.x, M2.y);

    push();
    noStroke();
    fill(200, 220, 250, 220);
    drawPolygon(centerPoly);

    // left triangle: rotate about M1 by angle = PI * t
    const angle = PI * t;
    const leftTriTransformed = leftTri.map(p => rotateAround(p, M1, angle));
    fill(250, 200, 200, 220);
    drawPolygon(leftTriTransformed);

    // right triangle: rotate about M2 by angle = PI * t
    const rightTriTransformed = rightTri.map(p => rotateAround(p, M2, angle));
    fill(250, 230, 180, 220);
    drawPolygon(rightTriTransformed);
    pop();

    // outlines
    stroke(0);
    strokeWeight(2);
    noFill();
    drawPolygon(centerPoly);
    drawPolygon(leftTriTransformed);
    drawPolygon(rightTriTransformed);

    for (let i = 0; i < pts.length; i++) {
        fill(255, 60, 60);
        stroke(0);
        circle(pts[i].x, pts[i].y, dotsize);
    }

    // labels
    noStroke();
    fill(0);
    textSize(12);
    text('A (base)', A.x + 6, A.y - 6);
    text('B (base)', B.x + 6, B.y - 6);
    text('C (apex)', C.x + 6, C.y - 6);

    // animate
    if (anim) {
        t += speed;
        if (t >= 1) {
            t = 1;
            anim = false; // stop at final position
        }
    }
}

function rotateAround(pt, center, ang) {
    const dx = pt.x - center.x;
    const dy = pt.y - center.y;
    const ca = cos(ang)
    const sa = sin(ang);
    const rx = dx*ca - dy*sa;
    const ry = dx*sa + dy*ca;
    return createVector(center.x + rx, center.y + ry);
}

function drawPolygon(arr) {
    beginShape();
    for (let p of arr) {
        vertex(p.x, p.y);
    }
    endShape(CLOSE);
}

function lineIntersection(a1, a2, b1, b2) {
    const x1 = a1.x, y1 = a1.y;
    const x2 = a2.x, y2 = a2.y;
    const x3 = b1.x, y3 = b1.y;
    const x4 = b2.x, y4 = b2.y;

    const denom = (x1 - x2)*(y3 - y4) - (y1 - y2)*(x3 - x4);
    if (abs(denom) < 1e-9) {
        return p5.Vector.add(b1, b2).mult(0.5);
    }

    const px = ((x1*y2 - y1*x2)*(x3 - x4) - (x1 - x2)*(x3*y4 - y3*x4)) / denom;
    const py = ((x1*y2 - y1*x2)*(y3 - y4) - (y1 - y2)*(x3*y4 - y3*x4)) / denom;
    return createVector(px, py);
}

function mousePressed() {
    for (let i = 0; i < pts.length; i++) {
        if (dist(mouseX, mouseY, pts[i].x, pts[i].y) < dotsize) {
            dragging = i;
            break;
        }
    }
}

function mouseDragged() {
    if (dragging !== null) {
        pts[dragging].x = constrain(mouseX, 0, width);
        pts[dragging].y = constrain(mouseY, 0, height);
    }
}

function mouseReleased() {
    dragging = null;
}

function keyPressed() {
    if (key === ' ') {
        toggleAnimation();
    }
}
