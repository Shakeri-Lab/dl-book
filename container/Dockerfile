# The amd64 child manifest is pinned, not only its mutable tag/multiarch index.
# The full Debian base supplies runtime libraries; no apt repository is consulted.
FROM --platform=linux/amd64 python:3.12.14-bookworm@sha256:9bbdaa0482ba166a4aa36b03162892a871c269311817cf7132db0922d6c7e91d

COPY container/canonical-runtime.json container/install_quarto.py /opt/dlbook/
RUN python /opt/dlbook/install_quarto.py
RUN python -m venv /opt/venv
ENV PATH="/opt/venv/bin:/opt/quarto/bin:${PATH}"
COPY container/requirements-linux-amd64.lock /opt/dlbook/requirements-linux-amd64.lock
RUN python -m pip install --no-cache-dir --require-hashes --only-binary=:all: --no-deps \
    --report /opt/dlbook/wheel-install-report.json \
    -r /opt/dlbook/requirements-linux-amd64.lock \
    && python -m pip check
COPY container/runtime_policy.py container/kernel_start.py container/canonical_python.py /opt/dlbook/
COPY container/kernel.json /opt/venv/share/jupyter/kernels/python3/kernel.json
COPY scripts/run_canonical_freeze.py /opt/dlbook/run_canonical_freeze.py

ENV QUARTO_PYTHON=/opt/venv/bin/python \
    JUPYTER_PATH=/opt/venv/share/jupyter \
    OMP_NUM_THREADS=1 OMP_DYNAMIC=FALSE \
    MKL_NUM_THREADS=1 MKL_DYNAMIC=FALSE MKL_CBWR=AVX2 \
    OPENBLAS_NUM_THREADS=1 VECLIB_MAXIMUM_THREADS=1 NUMEXPR_NUM_THREADS=1 \
    DLBOOK_TORCH_NUM_THREADS=1 DLBOOK_TORCH_INTEROP_THREADS=1 \
    ONEDNN_MAX_CPU_ISA=AVX2 PYTHONHASHSEED=0 CUDA_VISIBLE_DEVICES="" \
    MPLBACKEND=Agg TZ=UTC LC_ALL=C.UTF-8 LANG=C.UTF-8 \
    PYTHONDONTWRITEBYTECODE=1

RUN python -c "import platform,torch; assert platform.python_version() == '3.12.14'; assert platform.machine() == 'x86_64'; assert torch.__version__ == '2.12.1+cpu'; assert torch.version.cuda is None" \
    && test "$(quarto --version)" = "1.10.18"

ENTRYPOINT ["python", "/opt/dlbook/run_canonical_freeze.py"]
