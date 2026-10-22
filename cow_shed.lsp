;;; ==========================================================
;;; COWSHED1.LSP - Scalable single-row cow shed floor plan
;;; All cows stand in ONE row facing a low back wall with a feed
;;; trough. Central drain along the standing edge, open front,
;;; water trough in an end bay, gable roof outline above.
;;; Units: millimetres.
;;; Origin: X = 0 at first column line, Y = 0 on the drain centreline.
;;; Load with APPLOAD, then type COWSHED1.
;;; Change "Number of cows" to scale the whole design.
;;; ==========================================================

(defun cw:ask (msg def / v)
  (setq v (getreal (strcat "\n" msg " <" (rtos def 2 0) ">: ")))
  (if v v def)
)

(defun cw:layer (name col ltype)
  (if (and ltype (not (tblsearch "LTYPE" ltype)))
    (command "_.-LINETYPE" "_L" ltype "acad.lin" "")
  )
  (if (not (tblsearch "LAYER" name))
    (command "_.-LAYER" "_M" name "_C" (itoa col) name "")
  )
  (if ltype (command "_.-LAYER" "_LT" ltype name ""))
)

(defun cw:rect (p1 p2 lay)
  (setvar "CLAYER" lay)
  (command "_.RECTANG" p1 p2)
)

(defun cw:line (p1 p2 lay)
  (setvar "CLAYER" lay)
  (command "_.LINE" p1 p2 "")
)

(defun cw:txt (p h rot s lay)
  (setvar "CLAYER" lay)
  (command "_.TEXT" "_J" "_MC" p h rot s)
)

(defun cw:arrow (p1 p2 h lay / a)
  (setq a (angle p1 p2))
  (cw:line p1 p2 lay)
  (cw:line p2 (polar p2 (+ a pi 0.4) h) lay)
  (cw:line p2 (polar p2 (- (+ a pi) 0.4) h) lay)
)

(defun cw:dimh (p1 p2 loc)
  (setvar "CLAYER" "G-Dimensions")
  (command "_.DIMLINEAR" p1 p2 "_H" loc)
)

(defun cw:dimv (p1 p2 loc)
  (setvar "CLAYER" "G-Dimensions")
  (command "_.DIMLINEAR" p1 p2 "_V" loc)
)

;; trough = outer rectangle + inner rectangle (wall thickness tt)
(defun cw:trough (x1 y1 x2 y2 tt lay)
  (cw:rect (list x1 y1) (list x2 y2) lay)
  (cw:rect (list (+ x1 tt) (+ y1 tt)) (list (- x2 tt) (- y2 tt)) lay)
)

(defun c:COWSHED1 ( / cows sw sl tw tt dw wt cs colsp curb ov sc th wb ext gx
                      ls lt bays csp hb ycb yf ys0 ys1 ymid i x s
                      oldos oldlay olderr dscale)

  (setq olderr *error*)
  (defun *error* (msg)
    (if oldos  (setvar "OSMODE" oldos))
    (if oldlay (setvar "CLAYER" oldlay))
    (setq *error* olderr)
    (if (and msg (not (wcmatch (strcase msg) "*CANCEL*,*QUIT*")))
      (princ (strcat "\nError: " msg))
    )
    (princ)
  )

  (setq oldos (getvar "OSMODE") oldlay (getvar "CLAYER"))

  ;; ---------- INPUTS (press Enter for defaults) ----------
  (princ "\n--- Scalable single-row cow shed floor plan ---")
  (setq cows  (max 1 (fix (cw:ask "Number of cows (all in one row)" 3)))
        sw    (cw:ask "Stall width per cow (mm)" 1200)
        sl    (cw:ask "Standing length, trough to drain (mm)" 1800)
        tw    (cw:ask "Feed trough outer width (mm)" 500)
        tt    (cw:ask "Trough wall thickness (mm)" 100)
        dw    (cw:ask "Drain width (mm)" 300)
        wt    (cw:ask "Low back wall thickness (mm)" 150)
        wb    (cw:ask "Water trough end bay length (mm)" 900)
        cs    (cw:ask "Column size, square (mm)" 150)
        colsp (cw:ask "Max column spacing (mm)" 3000)
        curb  (cw:ask "Slab curb width (mm)" 150)
        ov    (cw:ask "Roof overhang beyond columns (mm)" 600)
        sc    (cw:ask "Plot scale 1:" 50)
  )
  (setq th (* 2.5 sc))

  ;; ---------- DERIVED VALUES (this is what makes it scalable) ----------
  (setq ext  1200.0                             ; slab extension beyond end columns
        gx   2500.0                             ; gravel border width
        ls   (* cows sw)                        ; feeding zone length (one stall per cow)
        lt   (+ ls wb)                          ; total shed length
        bays (max 1 (fix (+ (/ lt colsp) 0.999)))
        csp  (/ lt bays)                        ; actual column spacing
        hb   (+ (/ dw 2.0) sl tw)               ; inner face of back wall (Y)
        ycb  (+ hb (/ wt 2.0))                  ; back column row (on wall centreline)
        yf   (- (+ (/ dw 2.0) 300.0))           ; front column row (open side)
        ys0  (- yf 400.0)                       ; slab front edge
        ys1  (+ hb wt 400.0)                    ; slab back edge
        ymid (/ (+ yf ycb) 2.0)                 ; roof ridge line
  )

  (setvar "OSMODE" 0)

  ;; ---------- LAYERS ----------
  (cw:layer "G-Slab"       8   nil)
  (cw:layer "G-Walls"      6   nil)
  (cw:layer "G-Columns"    5   nil)
  (cw:layer "G-Roof"       1   "DASHED")
  (cw:layer "G-Trough"     4   nil)
  (cw:layer "G-Water"      150 nil)
  (cw:layer "G-Dividers"   2   nil)
  (cw:layer "G-Drainage"   3   nil)
  (cw:layer "G-Gravel"     9   nil)
  (cw:layer "G-Dimensions" 7   nil)
  (cw:layer "G-Text"       7   nil)
  (cw:layer "G-Hatch"      253 nil)

  ;; ---------- GROUND / GRAVEL ----------
  (cw:rect (list (- (+ ext curb gx)) (- ys0 curb gx))
           (list (+ lt ext curb gx) (+ ys1 curb gx)) "G-Gravel")

  ;; ---------- SLAB (curb outline, slab, hatch) ----------
  (cw:rect (list (- (+ ext curb)) (- ys0 curb))
           (list (+ lt ext curb) (+ ys1 curb)) "G-Slab")
  (cw:rect (list (- ext) ys0) (list (+ lt ext) ys1) "G-Slab")
  ;; the slab rectangle is the last object here, so the hatch lands on it
  (setvar "CLAYER" "G-Hatch")
  (command "_.-HATCH" "_P" "AR-CONC" (* sc 0.5) 0 "_S" "_L" "" "")

  ;; ---------- DRAIN (along the front edge of the standing area) ----------
  (cw:rect (list (- ext) (- (/ dw 2.0))) (list (+ lt ext) (/ dw 2.0)) "G-Drainage")

  ;; ---------- LOW BACK WALL ----------
  (cw:rect (list 0 hb) (list lt (+ hb wt)) "G-Walls")

  ;; ---------- FEED TROUGH (one row, against the wall) ----------
  (cw:trough 0 (- hb tw) ls hb tt "G-Trough")
  (cw:txt (list (/ ls 2.0) (- hb (/ tw 2.0))) th 0 "FEED TROUGH" "G-Text")

  ;; ---------- WATER TROUGH (end bay) ----------
  (cw:trough ls (- hb tw) lt hb tt "G-Water")
  (cw:txt (list (+ ls (/ wb 2.0)) (- hb (/ tw 2.0))) th 0 "WATER" "G-Text")

  ;; ---------- STALL DIVIDERS + NUMBERS ----------
  (setq i 0)
  (while (<= i cows)
    (setq x (* i sw))
    (cw:line (list x (- hb tw)) (list x (- hb tw 1000)) "G-Dividers")
    (setq i (1+ i))
  )
  (setq i 0)
  (while (< i cows)
    (setq x (+ (* i sw) (/ sw 2.0)))
    (cw:txt (list x (- hb tw 1500)) th 0 (itoa (1+ i)) "G-Text")
    (setq i (1+ i))
  )

  ;; ---------- COLUMNS (back row on wall, front row on open side) ----------
  (setq i 0)
  (while (<= i bays)
    (setq x (* i csp))
    (cw:rect (list (- x (/ cs 2.0)) (- ycb (/ cs 2.0)))
             (list (+ x (/ cs 2.0)) (+ ycb (/ cs 2.0))) "G-Columns")
    (cw:rect (list (- x (/ cs 2.0)) (- yf (/ cs 2.0)))
             (list (+ x (/ cs 2.0)) (+ yf (/ cs 2.0))) "G-Columns")
    ;; roof truss line (dashed) between each column pair
    (cw:line (list x yf) (list x ycb) "G-Roof")
    (setq i (1+ i))
  )

  ;; ---------- GABLE ROOF OUTLINE + RIDGE ----------
  (cw:rect (list (- ov) (- yf ov)) (list (+ lt ov) (+ ycb ov)) "G-Roof")
  (cw:line (list (- ov) ymid) (list (+ lt ov) ymid) "G-Roof")
  (cw:txt (list (/ lt 2.0) (+ ycb ov 250)) th 0 "GABLE ROOF OUTLINE (ABOVE)" "G-Roof")

  ;; ---------- SLOPE ARROW + DRAIN LABEL ----------
  (cw:arrow (list (* lt 0.15) 0) (list (+ (* lt 0.15) 1200) 0) (* th 1.2) "G-Drainage")
  (cw:txt (list (* lt 0.7) 0) th 0 "DRAIN 1:100" "G-Drainage")
  (cw:txt (list (/ lt 2.0) (- yf 250)) th 0 "OPEN FRONT" "G-Text")

  ;; ---------- TITLE ----------
  (cw:txt (list (/ lt 2.0) (+ ys1 2200)) (* 2 th) 0 "COW SHED (SINGLE ROW) - FLOOR PLAN" "G-Text")
  (cw:txt (list (/ lt 2.0) (- (+ ys1 2200) (* 3 th))) th 0
          (strcat "SCALE 1:" (rtos sc 2 0) "   CAPACITY " (itoa cows) " COWS")
          "G-Text")

  ;; ---------- DIMENSIONS ----------
  (setq dscale (getvar "DIMSCALE"))
  (setvar "DIMSCALE" sc)
  (cw:dimh (list (- ext) ys0) (list (+ lt ext) ys0)
           (list 0 (- ys0 1700)))                       ; overall slab length
  (cw:dimv (list (- ext) ys0) (list (- ext) ys1)
           (list (- (+ ext 1400)) 0))                   ; overall slab width
  (cw:dimh (list 0 yf) (list csp yf)
           (list 0 (- ys0 700)))                        ; column spacing
  (cw:dimh (list 0 hb) (list sw hb)
           (list 0 (+ ys1 900)))                        ; stall width
  (cw:dimv (list -300 hb) (list -300 (- hb tw)) (list -900 0))                 ; trough
  (cw:dimv (list -300 (- hb tw)) (list -300 (/ dw 2.0)) (list -900 0))         ; standing length
  (cw:dimv (list -300 (/ dw 2.0)) (list -300 (- (/ dw 2.0))) (list -900 0))    ; drain
  (setvar "DIMSCALE" dscale)

  ;; ---------- RESTORE + FINISH ----------
  (setvar "OSMODE" oldos)
  (setvar "CLAYER" oldlay)
  (setq *error* olderr)
  (command "_.ZOOM" "_E")
  (princ (strcat "\nDone. " (itoa cows) " cows in one row. Shed length "
                 (rtos lt 2 0) " mm, " (itoa bays) " bays at "
                 (rtos csp 2 0) " mm, column rows "
                 (rtos (- ycb yf) 2 0) " mm apart."))
  (princ)
)

(princ "\nCOWSHED1 loaded. Type COWSHED1 to run.")
(princ)