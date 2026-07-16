# Test-Time Memory and Control — Exercise Bank

<!-- NOVEL: needs sign-off -->

*Maintainer/instructor companion to Chapter 14 §14.8 and the epilogue. These are
solution sketches, not copy-ready graded solutions: code items state invariants and
expected outputs but deliberately omit a complete implementation. Select or adapt
items before assigning them. The public chapter retains unsolved versions in keeping
with the book's exercise policy.*

## 1. The local-constant qualification

**(Pencil.)** For a fixed query $q$, let

$$
L(c)=\frac12\sum_{\tau=1}^{t}\kappa(q,k_\tau)\|c-v_\tau\|^2,
\qquad \kappa(q,k_\tau)>0.
$$

Derive its minimizer. Substitute
$\kappa(q,k)=\exp(q^\top k/\sqrt d)$ and identify the attention operation. Then
explain why an unrestricted function $M$ with $w_{t,\tau}=1$ and no regularizer does
not imply the same average.

**Solution sketch.** Write $\kappa_\tau=\kappa(q,k_\tau)$. Then
$\nabla_cL=\sum_\tau\kappa_\tau(c-v_\tau)$. Because
$\sum_\tau\kappa_\tau>0$, stationarity gives
$c^*=\sum_\tau\kappa_\tau v_\tau/\sum_\tau\kappa_\tau$. The exponential dot kernel
makes the normalized coefficients `softmax(q @ K.T / sqrt(d))`, so the prediction is
that row times $V$. The constant model supplies the average. An unrestricted $M$ can
interpolate distinct stored keys and is not determined at an unseen query; unit
observation weights alone do not impose local averaging.

## 2. One SGD step, DeltaNet, and forgetting

**(Pencil.)** Let $M(q)=h^\top q$ and
$\ell_t(h)=\tfrac12(h^\top k_t-v_t)^2$. Derive one SGD step and rearrange it into

$$
h_t=(I-\eta_tk_tk_t^\top)h_{t-1}+\eta_tv_tk_t.
$$

As a follow-up, assign history weights $w_{t,\tau}=\gamma^{t-\tau}$. What role does
$\gamma$ play, and what additional qualification is required before writing it as a
factor multiplying the old state?

**Solution sketch.** The gradient is $k_t(k_t^\top h-v_t)$; substitution and
collection give the displayed recurrence. The coefficient
$I-\eta_tk_tk_t^\top$ is the token-dependent transition and $\eta_tv_tk_t$ is the
write. In the objective, $0<\gamma<1$ is an exponential recency weight. In a simple
state recurrence, a factor $\gamma h_{t-1}$ acts as a retention or forget gate. Those
statements are related but not identical: exact exponentially weighted least squares
normally tracks a covariance or inverse-covariance state. Directly decaying $h$ is a
fading-memory solver choice unless that extra derivation is supplied.

## 3. The allclose bridge

**(Code.)** Choose a positive feature map $\phi$, stream twelve key--value pairs into

$$
S_t=\sum_{\tau\le t}\phi(k_\tau)v_\tau^\top,
\qquad z_t=\sum_{\tau\le t}\phi(k_\tau),
$$

and at every prefix compare
$\phi(q)^\top S_t/(\phi(q)^\top z_t)$ with a traversal over all pairs seen so far.
Use seed 6050 and an `allclose` assertion. Repeat after omitting $z_t$.

**Solution sketch.** A suitable map is `where(x > 0, x + 1, exp(x))`. Update $S$ by
an outer product and $z$ by addition. The prefix assertions pass to floating-point
tolerance; in the chapter's final-prefix check the maximum difference is
$3.47\times10^{-17}$. Omitting $z_t$ removes query-dependent normalization, so the
unnormalized numerator generally disagrees. The sufficient state is the pair $(S,z)$.

## 4. Recall under capacity

**(Code.)** Reproduce the Chapter 14 key--value mechanism test and sweep at least five
state widths $d$. Keep a disjoint development branch for step size and write-gate
choices; open a sealed endpoint branch once. Plot top-1 recall against both $N$ and
$N/d$. Include full-table softmax, a delta state, and a gated state with an independent
priority bit.

**Solution sketch.** Normalize random keys and values; query stored keys; decode by
nearest stored value. Hold keys, values, order, queries, and decoder fixed across arms.
The full table should remain near the constructed ceiling with a sufficiently sharp
softmax. Delta curves should align more closely against load $N/d$ than against
raw $N$ and fall after capacity pressure grows. The gate should raise priority recall
while lowering ordinary recall. Report the extra priority bit, unmatched arithmetic,
and the distinction between top-1 identification and exact numeric interpolation.

## 5. Horizon changes the first action

**(Code.)** For $a=0.9$, $b=1$, $q_c=1$, and $r_c=0.1$, sweep horizons
$T=1,\ldots,50$. Apply the scalar Riccati recursion, plot the first-action gain $K_1$
against $T$, and print the values at $T=1$ and $T=10$. Predict the limiting shape
before running the code.

**Solution sketch.** Initialize $P=q_c$ for each horizon, apply
$P\leftarrow q_c+a^2P-(abP)^2/(r_c+b^2P)$ exactly $T-1$ times, then compute
$K_1=-bPa/(r_c+b^2P)$. The two checks are $-0.8181818$ and $-0.8233456$. The curve
moves quickly and approaches the infinite-horizon fixed point. The mechanism claim is
only that the horizon changes the first action before another output token is emitted.

## 6. A rematch, not a referendum

**(Critique.)** Read Table 2 and §E.2 of Wang, Yang, Vidal et al. (2026). In the
book's comparison vocabulary, classify which comparisons are parameter-matched,
training-recipe-matched, generated-token-matched, and inference-compute-matched.
Design a compute-matched baseline for horizon-$T$ planning. End with the strongest
claim the evidence could support without turning the table into a referendum on model
families.

**Solution sketch.** Table 2 says the inserted modules have comparable additional
parameter counts and uses the same placement interval, but it does not publish enough
exact counts to certify a strict parameter match. The training recipe is substantially
shared. Section E.2 fixes the chain-of-thought prompt and compares generated-token
budgets; it does not count TTC's internal horizon work as equivalent to a generated
token, so total inference compute is not matched. A rematch would fix backbone, data,
prompt, sampler, output cap, and hardware; meter FLOPs or synchronized wall time for
all internal and external work; allocate the same total budget to extra sampling,
self-consistency, or another memory/control baseline; and plot quality versus measured
compute with uncertainty. The table is evidence for this paper's implementations
under its recipe, not a general architecture ranking: a rematch, not a referendum.

## 7. What would show planning rather than fluent memory?

**(Mechanism-test design.)** Use §E.6 of the paper as an object of critique. Design a
test that would distinguish sensitivity to a future cost or dynamics model from topic
or position correlations in hidden states.

**Solution sketch.** Hold the prefix, parameters, and current representation fixed,
then intervene on a delayed terminal cost or future dynamics while preserving surface
topic. A planning mechanism should shift the *first* action in the direction predicted
by the corresponding Riccati solution. Compare against parameter- and compute-matched
memory-only, shuffled-step, random-control-module, and topic controls. Probe
correlations are useful diagnostics, but without an intervention they do not establish
that the layer used a plan causally.

## 8. Storage, computation, and recoverability

**(Pencil.)** For key width $d_k$, value width $d_v$, feature width $r$, and prefix
length $t$, write the stored state and leading update/query cost for (a) exact softmax
with a KV cache, (b) a factorized kernel, and (c) a dense vector delta state. For each,
name what can no longer be reconstructed.

**Solution sketch.** Softmax stores $O(t(d_k+d_v))$ rows and a new query costs
$O(t(d_k+d_v))$; no K/V row is compressed, although a read remains a mixture. The
factorized solver stores $(S,z)$ in $O(rd_v+r)$ and reads or writes in $O(rd_v)$ plus
feature-map costs; raw rows cannot generally be recovered, though its traversal is
exact for the chosen factorized kernel. Delta stores $H$ in $O(d_kd_v)$ and uses a
dense $O(d_kd_v)$ update/read; individual pairs and their order cannot generally be
reconstructed. Structured SSM implementations may have a different ledger.

## 9. What exactly does selectivity turn?

**(Pencil and interpretation.)** Map Mamba-style selectivity onto the four dials of
the shared regression frame. Which statement is a derivation, and which is an
analogy? Contrast the answer with Gated DeltaNet.

**Solution sketch.** Input-dependent state retention and input injection play roles
analogous to token-dependent history weighting, forgetting, and step-size/write
schedules. That mapping explains the design pressure but does not derive Mamba as the
optimizer of the displayed least-squares objective; its structured state and selective
scan are their own construction. For a delta layer, one newest-pair SGD step *is*
algebraically the delta recurrence. Gated DeltaNet then adds learned gates around that
update, so the regression-to-delta link is direct while the broader SSM link remains
interpretive.

<!-- /NOVEL -->
